"""
AI Interviewer Agent using LangGraph
Handles conversational interview flow with natural back-and-forth
"""
import os
from typing import TypedDict, List, Dict, Any, Literal, Optional
from openai import OpenAI
from langgraph.graph import StateGraph, END
import json

# Import ElevenLabs service
try:
    from services.elevenlabs_service import ElevenLabsService
    ELEVENLABS_AVAILABLE = True
except ImportError:
    ELEVENLABS_AVAILABLE = False
    print("Warning: ElevenLabs service not available")


class InterviewState(TypedDict):
    """State for the interview conversation"""
    question: str  # Original interview question
    conversation_history: List[Dict[str, str]]  # Full conversation
    current_stage: str  # Current stage: "asking_question", "listening", "clarifying", "follow_up", "completed"
    user_answer: str  # Current user answer
    clarification_request: Optional[str]  # If user asked for clarification
    interviewer_response: str  # Current interviewer response text
    audio_data: Optional[bytes]  # Audio bytes for interviewer response
    follow_up_count: int  # Number of follow-up questions asked
    interview_complete: bool  # Whether interview is complete


class InterviewAgent:
    """
    AI Interviewer Agent that conducts natural conversations
    """
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        self.openai_client = OpenAI(api_key=api_key)
        self.model = "gpt-4o-mini"  # Using mini for cost efficiency
        
        # Initialize ElevenLabs if available
        self.elevenlabs_service = None
        if ELEVENLABS_AVAILABLE:
            try:
                self.elevenlabs_service = ElevenLabsService()
            except Exception as e:
                print(f"Warning: Could not initialize ElevenLabs: {e}")
                self.elevenlabs_service = None
        
        # Build the LangGraph workflow
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow for interview conversation"""
        
        workflow = StateGraph(InterviewState)
        
        # Add nodes
        workflow.add_node("ask_question", self.ask_question)
        workflow.add_node("listen_answer", self.listen_answer)
        workflow.add_node("handle_clarification", self.handle_clarification)
        workflow.add_node("generate_followup", self.generate_followup)
        workflow.add_node("complete_interview", self.complete_interview)
        
        # Set entry point
        workflow.set_entry_point("ask_question")
        
        # Add edges
        workflow.add_edge("ask_question", "listen_answer")
        
        # Conditional edge from listen_answer
        workflow.add_conditional_edges(
            "listen_answer",
            self.should_clarify_or_continue,
            {
                "clarify": "handle_clarification",
                "continue": "generate_followup",
                "complete": "complete_interview"
            }
        )
        
        workflow.add_edge("handle_clarification", "ask_question")
        
        # Conditional edge from generate_followup
        workflow.add_conditional_edges(
            "generate_followup",
            self.should_continue_interview,
            {
                "continue": "ask_question",
                "complete": "complete_interview"
            }
        )
        
        workflow.add_edge("complete_interview", END)
        
        return workflow.compile()
    
    async def ask_question(self, state: InterviewState) -> InterviewState:
        """
        Generate and ask a question (initial or follow-up)
        """
        # Get the response text - it should already be set by previous nodes
        response_text = state.get("interviewer_response", "")
        
        # If no response text yet, generate the initial question
        if not response_text:
            if len(state.get("conversation_history", [])) == 0:
                # First question - use the original question
                question_text = state["question"]
                response_text = f"Hi! Thanks for joining. Let's start with this question: {question_text} Take your time and think through your answer."
            else:
                # This shouldn't happen, but fallback
                response_text = state.get("question", "Let's begin the interview.")
        
        # Generate audio if ElevenLabs is available
        audio_data = None
        if self.elevenlabs_service and response_text:
            try:
                audio_data = await self.elevenlabs_service.text_to_speech(response_text)
            except Exception as e:
                print(f"Warning: Could not generate audio: {e}")
                import traceback
                traceback.print_exc()
        
        # Update conversation history (only if not already added)
        conversation_history = state.get("conversation_history", [])
        if not conversation_history or conversation_history[-1].get("content") != response_text:
            conversation_history.append({
                "role": "interviewer",
                "content": response_text
            })
        
        return {
            **state,
            "interviewer_response": response_text,
            "audio_data": audio_data,
            "conversation_history": conversation_history,
            "current_stage": "asking_question"
        }
    
    async def listen_answer(self, state: InterviewState) -> InterviewState:
        """
        Process user's answer and determine next step
        """
        user_answer = state.get("user_answer", "")
        
        if not user_answer.strip():
            # No answer provided, ask again
            response_text = "I didn't catch that. Could you please repeat your answer?"
            # Generate audio
            audio_data = None
            if self.elevenlabs_service:
                try:
                    audio_data = await self.elevenlabs_service.text_to_speech(response_text)
                except Exception as e:
                    print(f"Warning: Could not generate audio: {e}")
            
            return {
                **state,
                "interviewer_response": response_text,
                "audio_data": audio_data,
                "current_stage": "listening"
            }
        
        # Check if user is asking for clarification (if not already flagged)
        if not state.get("clarification_request"):
            clarification_check = await self._check_for_clarification(user_answer)
            
            if clarification_check["is_clarification"]:
                return {
                    **state,
                    "clarification_request": user_answer,
                    "current_stage": "clarifying"
                }
        
        # Add user answer to conversation history
        conversation_history = state.get("conversation_history", [])
        conversation_history.append({
            "role": "candidate",
            "content": user_answer
        })
        
        return {
            **state,
            "conversation_history": conversation_history,
            "current_stage": "listening"
        }
    
    async def handle_clarification(self, state: InterviewState) -> InterviewState:
        """
        Handle when user asks for clarification
        """
        clarification_request = state.get("clarification_request", "")
        question = state.get("question", "")
        conversation_history = state.get("conversation_history", [])
        
        # Generate helpful clarification response
        clarification_prompt = f"""You are a professional Product Management interviewer conducting an interview.

The original question was: "{question}"

The candidate asked for clarification: "{clarification_request}"

Provide a helpful, clear clarification that:
1. Explains what you're looking for
2. Gives context or examples if helpful
3. Re-frames the question if needed
4. Is encouraging and professional

Keep your response concise (2-3 sentences max)."""
        
        messages = [
            {"role": "system", "content": "You are a helpful, professional PM interviewer."},
            {"role": "user", "content": clarification_prompt}
        ]
        
        response = self.openai_client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7
        )
        
        clarification_response = response.choices[0].message.content.strip()
        
        # Generate audio
        audio_data = None
        if self.elevenlabs_service:
            try:
                audio_data = await self.elevenlabs_service.text_to_speech(clarification_response)
            except Exception as e:
                print(f"Warning: Could not generate audio: {e}")
                import traceback
                traceback.print_exc()
        
        # Add user's clarification request to conversation if not already there
        if conversation_history and conversation_history[-1].get("role") != "candidate":
            conversation_history.append({
                "role": "candidate",
                "content": clarification_request
            })
        
        # Add clarification response to conversation
        conversation_history.append({
            "role": "interviewer",
            "content": clarification_response
        })
        
        return {
            **state,
            "interviewer_response": clarification_response,
            "audio_data": audio_data,
            "conversation_history": conversation_history,
            "clarification_request": None,  # Clear the clarification request
            "current_stage": "clarifying"
        }
    
    async def generate_followup(self, state: InterviewState) -> InterviewState:
        """
        Generate follow-up question or response based on user's answer
        """
        question = state.get("question", "")
        conversation_history = state.get("conversation_history", [])
        follow_up_count = state.get("follow_up_count", 0)
        
        # Limit follow-ups to 2-3 to keep interview focused
        max_followups = 2
        
        if follow_up_count >= max_followups:
            # End interview after max follow-ups
            return {
                **state,
                "interview_complete": True,
                "current_stage": "completed"
            }
        
        # Generate follow-up question or response
        followup_prompt = f"""You are a professional Product Management interviewer conducting an interview.

Original question: "{question}"

Conversation so far:
{self._format_conversation_history(conversation_history)}

Based on the candidate's answer, generate a natural follow-up response. This could be:
1. A follow-up question to dive deeper (e.g., "That's interesting. Can you tell me more about...")
2. A clarifying question (e.g., "What was the outcome of that decision?")
3. A brief acknowledgment and continuation (e.g., "Great. Now, thinking about...")

Keep your response:
- Natural and conversational
- Professional but friendly
- Concise (1-2 sentences)
- Focused on understanding the candidate better

If the answer seems complete and you've asked enough follow-ups, you can wrap up with: "Thank you for that detailed answer. That's very helpful."

Generate your response:"""
        
        messages = [
            {"role": "system", "content": "You are a professional PM interviewer. Generate natural follow-up questions."},
            {"role": "user", "content": followup_prompt}
        ]
        
        response = self.openai_client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7
        )
        
        followup_response = response.choices[0].message.content.strip()
        
        # Check if this is a wrap-up (interview complete)
        is_complete = any(phrase in followup_response.lower() for phrase in [
            "thank you", "that's helpful", "that's very helpful", "wrap up"
        ])
        
        # Generate audio
        audio_data = None
        if self.elevenlabs_service:
            try:
                audio_data = await self.elevenlabs_service.text_to_speech(followup_response)
            except Exception as e:
                print(f"Warning: Could not generate audio: {e}")
        
        # Add to conversation
        conversation_history.append({
            "role": "interviewer",
            "content": followup_response
        })
        
        return {
            **state,
            "interviewer_response": followup_response,
            "audio_data": audio_data,
            "conversation_history": conversation_history,
            "follow_up_count": follow_up_count + 1,
            "interview_complete": is_complete,
            "current_stage": "follow_up"
        }
    
    async def complete_interview(self, state: InterviewState) -> InterviewState:
        """
        Complete the interview and prepare for feedback
        """
        return {
            **state,
            "current_stage": "completed",
            "interview_complete": True
        }
    
    async def should_clarify_or_continue(
        self, state: InterviewState
    ) -> Literal["clarify", "continue", "complete"]:
        """
        Determine if we should clarify, continue, or complete
        """
        if state.get("clarification_request"):
            return "clarify"
        
        if state.get("interview_complete"):
            return "complete"
        
        return "continue"
    
    async def should_continue_interview(
        self, state: InterviewState
    ) -> Literal["continue", "complete"]:
        """
        Determine if interview should continue or complete
        """
        if state.get("interview_complete"):
            return "complete"
        
        return "continue"
    
    async def _check_for_clarification(self, user_input: str) -> Dict[str, Any]:
        """
        Check if user is asking for clarification using GPT for better detection
        """
        clarification_keywords = [
            "clarify", "clarification", "not sure", "don't understand", "don't know",
            "can you explain", "what do you mean", "could you give an example",
            "i'm confused", "not clear", "unclear", "what does", "what is",
            "could you clarify", "can you clarify", "i don't understand",
            "not understand", "help me understand", "explain more"
        ]
        
        user_lower = user_input.lower().strip()
        
        # Quick keyword check first
        is_clarification_keyword = any(keyword in user_lower for keyword in clarification_keywords)
        
        # Also check if it's a very short question (likely clarification)
        is_short_question = len(user_input.split()) < 10 and any(q in user_lower for q in ["what", "how", "can", "could", "why"])
        
        # Use GPT for more intelligent detection if keyword check is ambiguous
        if is_clarification_keyword or is_short_question:
            try:
                check_prompt = f"""Is the following user input asking for clarification about an interview question? Answer only "yes" or "no".

User input: "{user_input}"

Answer:"""
                
                messages = [
                    {"role": "system", "content": "You are a classifier. Answer only 'yes' or 'no'."},
                    {"role": "user", "content": check_prompt}
                ]
                
                response = self.openai_client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.1,
                    max_tokens=10
                )
                
                gpt_answer = response.choices[0].message.content.strip().lower()
                is_clarification = "yes" in gpt_answer
            except Exception as e:
                print(f"Warning: Clarification check failed, using keyword match: {e}")
                is_clarification = is_clarification_keyword
        else:
            is_clarification = False
        
        return {
            "is_clarification": is_clarification,
            "confidence": 0.9 if is_clarification else 0.1
        }
    
    def _format_conversation_history(self, history: List[Dict[str, str]]) -> str:
        """Format conversation history for prompt"""
        formatted = []
        for msg in history:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            formatted.append(f"{role.capitalize()}: {content}")
        return "\n".join(formatted)
    
    async def start_interview(self, question: str) -> Dict[str, Any]:
        """
        Start a new interview session
        
        Returns:
            Initial state with first question
        """
        # Generate the initial question text
        question_text = f"Hi! Thanks for joining. Let's start with this question: {question} Take your time and think through your answer."
        
        # Generate audio if ElevenLabs is available
        audio_data = None
        if self.elevenlabs_service:
            try:
                audio_data = await self.elevenlabs_service.text_to_speech(question_text)
                print(f"Generated audio: {len(audio_data) if audio_data else 0} bytes")
            except Exception as e:
                print(f"Warning: Could not generate audio: {e}")
                import traceback
                traceback.print_exc()
        
        initial_state: InterviewState = {
            "question": question,
            "conversation_history": [{"role": "interviewer", "content": question_text}],
            "current_stage": "asking_question",
            "user_answer": "",
            "clarification_request": None,
            "interviewer_response": question_text,
            "audio_data": audio_data,
            "follow_up_count": 0,
            "interview_complete": False
        }
        
        return {
            "question": initial_state["question"],
            "interviewer_response": initial_state["interviewer_response"],
            "audio_data": initial_state.get("audio_data"),
            "conversation_history": initial_state["conversation_history"],
            "current_stage": initial_state["current_stage"]
        }
    
    async def process_user_response(
        self, 
        current_state: Dict[str, Any], 
        user_answer: str,
        is_clarification_request: bool = False
    ) -> Dict[str, Any]:
        """
        Process user's answer and get next interviewer response
        
        Args:
            current_state: Current interview state
            user_answer: User's transcribed answer
            is_clarification_request: Explicit flag for clarification requests
            
        Returns:
            Updated state with interviewer response
        """
        # Convert dict to InterviewState
        state: InterviewState = {
            "question": current_state.get("question", ""),
            "conversation_history": current_state.get("conversation_history", []),
            "current_stage": current_state.get("current_stage", "listening"),
            "user_answer": user_answer,
            "clarification_request": user_answer if is_clarification_request else current_state.get("clarification_request"),
            "interviewer_response": current_state.get("interviewer_response", ""),
            "audio_data": current_state.get("audio_data"),
            "follow_up_count": current_state.get("follow_up_count", 0),
            "interview_complete": current_state.get("interview_complete", False)
        }
        
        # If explicit clarification request, route directly to clarification handler
        if is_clarification_request:
            # Handle clarification directly
            clarification_result = await self.handle_clarification(state)
            # Then ask the question again
            result = await self.ask_question(clarification_result)
        else:
            # Run workflow normally
            result = await self.workflow.ainvoke(state)
        
        return {
            "question": result["question"],
            "interviewer_response": result["interviewer_response"],
            "audio_data": result.get("audio_data"),
            "conversation_history": result["conversation_history"],
            "current_stage": result["current_stage"],
            "interview_complete": result.get("interview_complete", False),
            "follow_up_count": result.get("follow_up_count", 0)
        }
