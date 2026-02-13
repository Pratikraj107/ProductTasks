# AI Interviewer Feature - Implementation Plan

## Overview
Transform the mock interview experience from a one-way recording session into an interactive, conversational AI interviewer that:
- Asks questions using ElevenLabs voice synthesis
- Listens to user answers in real-time
- Responds to clarifying questions naturally
- Provides contextual follow-up questions
- Maintains conversation context throughout

---

## Current State Analysis

### Existing Flow
1. User clicks "Try Now" → Opens `MockInterviewModal`
2. User sees question text
3. User records answer (audio + transcription)
4. User submits → Gets AI feedback
5. **End** - No interaction, no conversation

### Current Components
- `MockInterviewModal.tsx` - Handles recording and feedback
- `InterviewFeedbackAgent` - Provides post-answer feedback
- OpenAI Whisper - For transcription
- Browser Speech Recognition - For real-time transcription

---

## Proposed Architecture

### Option 1: LangGraph (Recommended) ✅
**Why LangGraph?**
- Built for conversational AI workflows
- State management for interview context
- Easy to add conditional logic (follow-ups, clarifications)
- Supports streaming responses
- Good for complex multi-turn conversations

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │         AIInterviewerModal Component             │   │
│  │  - Audio playback (ElevenLabs)                    │   │
│  │  - Real-time transcription (Whisper)              │   │
│  │  - Conversation UI                                │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ WebSocket / SSE
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Backend (FastAPI)                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         LangGraph Interview Agent                 │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │ State:                                      │  │   │
│  │  │ - Current question                          │  │   │
│  │  │ - Conversation history                      │  │   │
│  │  │ - User answers                               │  │   │
│  │  │ - Interview stage                            │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  │                                                   │   │
│  │  Nodes:                                          │   │
│  │  1. Ask Question                                 │   │
│  │  2. Listen to Answer                             │   │
│  │  3. Handle Clarification                          │   │
│  │  4. Generate Follow-up                            │   │
│  │  5. End Interview                                │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         ElevenLabs Integration                    │   │
│  │  - Text-to-Speech for questions                   │   │
│  │  - Voice selection (professional interviewer)      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         OpenAI Integration                        │   │
│  │  - GPT-4 for interview logic                      │   │
│  │  - Whisper for transcription                      │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Option 2: Simple State Machine (Alternative)
**Why Consider?**
- Simpler implementation
- Less dependencies
- Faster to build
- Good for MVP

**Architecture:**
- Python state machine with FastAPI endpoints
- Frontend manages state via API calls
- Less sophisticated but more straightforward

---

## Recommended Approach: LangGraph

### Why LangGraph?
1. **Conversation Management**: Handles complex interview flows naturally
2. **State Persistence**: Maintains context across turns
3. **Conditional Logic**: Easy to add "if user asks clarification, then..."
4. **Streaming**: Can stream responses for better UX
5. **Extensibility**: Easy to add features later (multi-question interviews, etc.)

### LangGraph Flow

```python
# Interview State
{
    "question": "Original interview question",
    "conversation_history": [
        {"role": "interviewer", "content": "..."},
        {"role": "candidate", "content": "..."}
    ],
    "current_stage": "asking_question" | "listening" | "clarifying" | "follow_up" | "completed",
    "user_answer": "",
    "clarification_request": None,
    "follow_up_questions": [],
    "interview_metadata": {...}
}

# Nodes
1. START → Ask Initial Question
2. Ask Question → Generate TTS → Play Audio → Wait for Answer
3. Wait for Answer → Transcribe → Check if Clarification Needed
4. If Clarification → Handle Clarification → Ask Question
5. If Answer Complete → Generate Follow-up → Ask Question OR End
6. End → Generate Final Feedback
```

---

## Technical Implementation Plan

### Phase 1: Backend - LangGraph Interview Agent

#### 1.1 Create Interview Agent (`backend/agents/interview_agent.py`)
```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List
from openai import OpenAI
import elevenlabs

class InterviewState(TypedDict):
    question: str
    conversation_history: List[dict]
    current_stage: str
    user_answer: str
    clarification_request: str | None
    interviewer_response: str
    audio_url: str | None  # For ElevenLabs audio

class InterviewAgent:
    def __init__(self):
        self.openai_client = OpenAI()
        self.elevenlabs_client = elevenlabs.Client()
        self.voice_id = "professional_interviewer_voice_id"
        
    def build_graph(self):
        workflow = StateGraph(InterviewState)
        
        workflow.add_node("ask_question", self.ask_question)
        workflow.add_node("listen_answer", self.listen_answer)
        workflow.add_node("handle_clarification", self.handle_clarification)
        workflow.add_node("generate_followup", self.generate_followup)
        
        workflow.set_entry_point("ask_question")
        workflow.add_edge("ask_question", "listen_answer")
        workflow.add_conditional_edges(
            "listen_answer",
            self.should_clarify_or_continue,
            {
                "clarify": "handle_clarification",
                "continue": "generate_followup",
                "end": END
            }
        )
        workflow.add_edge("handle_clarification", "ask_question")
        workflow.add_conditional_edges(
            "generate_followup",
            self.should_continue_interview,
            {
                "continue": "ask_question",
                "end": END
            }
        )
        
        return workflow.compile()
    
    async def ask_question(self, state: InterviewState):
        # Generate question text
        # Convert to speech via ElevenLabs
        # Return state with audio_url
        pass
    
    async def listen_answer(self, state: InterviewState):
        # Transcribe user audio
        # Check if clarification needed
        # Update state
        pass
    
    async def handle_clarification(self, state: InterviewState):
        # Generate clarification response
        # Convert to speech
        pass
```

#### 1.2 API Endpoints (`backend/main.py`)
```python
# WebSocket endpoint for real-time conversation
@app.websocket("/api/interview/ws/{session_id}")
async def interview_websocket(websocket: WebSocket, session_id: str):
    # Handle real-time interview flow
    pass

# REST endpoint for session management
@app.post("/api/interview/start")
async def start_interview(request: StartInterviewRequest):
    # Initialize interview session
    pass

@app.post("/api/interview/audio")
async def process_audio(audio: UploadFile, session_id: str):
    # Process user audio, return interviewer response
    pass
```

#### 1.3 ElevenLabs Integration
```python
# backend/services/elevenlabs_service.py
class ElevenLabsService:
    def __init__(self):
        self.client = elevenlabs.Client(api_key=os.getenv("ELEVENLABS_API_KEY"))
        self.voice_id = os.getenv("ELEVENLABS_VOICE_ID", "default_professional")
    
    async def text_to_speech(self, text: str) -> bytes:
        audio = self.client.generate(
            text=text,
            voice=self.voice_id,
            model="eleven_multilingual_v2"
        )
        return audio
```

### Phase 2: Frontend - Interactive Interview UI

#### 2.1 New Component: `AIInterviewerModal.tsx`
```typescript
interface AIInterviewerModalProps {
  question: string;
  questionId?: number;
  onClose: () => void;
}

// States:
// - 'waiting' - Waiting for interviewer to speak
// - 'listening' - Listening to user
// - 'processing' - Processing response
// - 'speaking' - AI is speaking
// - 'completed' - Interview complete
```

#### 2.2 Features:
- **Audio Playback**: Play ElevenLabs audio when AI speaks
- **Real-time Transcription**: Show user speech as they speak
- **Conversation History**: Display conversation flow
- **Visual Indicators**: Show when AI is speaking/listening
- **Clarification Handling**: Special UI for clarification requests

#### 2.3 WebSocket Connection
```typescript
const ws = new WebSocket(`${WS_URL}/api/interview/ws/${sessionId}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'interviewer_speech') {
    // Play audio
    playAudio(data.audio_url);
  } else if (data.type === 'transcription') {
    // Update transcript
    updateTranscript(data.text);
  }
};
```

---

## Data Flow

### Interview Session Flow

```
1. User clicks "Try Now"
   ↓
2. Frontend: POST /api/interview/start
   - Question: "Tell me about a time you..."
   ↓
3. Backend: Initialize LangGraph session
   - Generate initial question
   - Convert to speech (ElevenLabs)
   - Return: {session_id, audio_url, question_text}
   ↓
4. Frontend: Play audio, show question
   ↓
5. User starts speaking
   ↓
6. Frontend: Stream audio to WebSocket
   ↓
7. Backend: 
   - Transcribe (Whisper)
   - Check if clarification needed
   - If yes → Generate clarification → TTS → Return
   - If no → Generate follow-up → TTS → Return
   ↓
8. Frontend: Play response, update UI
   ↓
9. Repeat steps 5-8 until interview complete
   ↓
10. Backend: Generate final feedback
   ↓
11. Frontend: Show feedback (existing feedback UI)
```

---

## Key Features to Implement

### 1. Natural Conversation Flow
- AI asks question
- User answers
- AI can ask clarifying questions
- User can ask for clarification
- AI provides follow-up questions
- Natural back-and-forth

### 2. Clarification Handling
**When user asks clarification:**
- "Can you clarify what you mean by X?"
- "I'm not sure I understand..."
- "Could you give an example?"

**AI Response:**
- Understands the clarification request
- Provides helpful explanation
- Re-asks or reframes original question

### 3. Context Awareness
- Remembers previous answers
- Can reference earlier parts of conversation
- Follow-up questions build on previous answers

### 4. Interview Stages
- **Introduction**: "Hi, let's start with..."
- **Main Question**: Original interview question
- **Clarification**: If needed
- **Follow-ups**: "Tell me more about..."
- **Wrap-up**: "Thank you, that's helpful"

---

## Technology Stack

### Backend
- **LangGraph**: Conversation orchestration
- **OpenAI GPT-4**: Interview logic, clarification handling
- **ElevenLabs**: Text-to-speech for interviewer voice
- **OpenAI Whisper**: Speech-to-text for user answers
- **FastAPI**: API endpoints + WebSocket support
- **WebSockets**: Real-time bidirectional communication

### Frontend
- **React**: UI components
- **WebSocket API**: Real-time communication
- **Web Audio API**: Audio playback
- **MediaRecorder API**: Audio recording
- **Speech Recognition API**: Real-time transcription (optional)

### Dependencies to Add
```python
# backend/requirements.txt
langgraph>=0.0.20
elevenlabs>=0.2.27
websockets>=12.0
```

```json
// frontend/package.json
// No new dependencies needed (use native WebSocket)
```

---

## Environment Variables

```bash
# Backend (.env)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id  # Optional, defaults to professional voice
OPENAI_API_KEY=your_openai_key  # Already exists
```

---

## Implementation Phases

### Phase 1: MVP (Week 1)
- [ ] LangGraph interview agent skeleton
- [ ] Basic question → answer → feedback flow
- [ ] ElevenLabs integration
- [ ] Simple REST API (no WebSocket yet)
- [ ] Basic frontend UI

### Phase 2: Real-time (Week 2)
- [ ] WebSocket implementation
- [ ] Real-time audio streaming
- [ ] Live transcription
- [ ] Conversation history UI

### Phase 3: Clarifications (Week 3)
- [ ] Clarification detection logic
- [ ] Clarification response generation
- [ ] UI for clarification flow

### Phase 4: Polish (Week 4)
- [ ] Error handling
- [ ] Loading states
- [ ] Audio quality optimization
- [ ] Testing & bug fixes

---

## Alternative: Simpler Approach (If LangGraph is too complex)

### Simple State Machine Approach
```python
class InterviewSession:
    def __init__(self, question: str):
        self.question = question
        self.conversation = []
        self.stage = "asking_question"
    
    async def process_user_input(self, audio_bytes: bytes):
        # Transcribe
        transcript = await transcribe(audio_bytes)
        
        # Check if clarification
        if self.is_clarification_request(transcript):
            response = await self.handle_clarification(transcript)
        else:
            response = await self.handle_answer(transcript)
        
        # Convert to speech
        audio = await elevenlabs_tts(response)
        
        return {"text": response, "audio": audio}
```

**Pros:**
- Simpler to implement
- Easier to debug
- Less dependencies

**Cons:**
- Less sophisticated
- Harder to extend
- More manual state management

---

## Cost Considerations

### ElevenLabs
- **Free Tier**: 10,000 characters/month
- **Starter**: $5/month - 30,000 characters
- **Creator**: $22/month - 100,000 characters
- **Pro**: $99/month - 500,000 characters

**Estimate**: ~500-1000 characters per question
- 10 questions = ~5,000-10,000 characters
- Free tier might work for testing
- Starter tier for production

### OpenAI
- **GPT-4**: Already in use
- **Whisper**: Already in use
- Additional cost: Minimal (conversation context)

---

## User Experience Flow

### Example Conversation:

```
🤖 AI: "Hi! Thanks for joining. Let's start with this question: 
        Tell me about a time you had to prioritize features 
        with limited resources. Take your time."

👤 User: "Well, at my previous company, we had three major 
        features requested but only resources for one..."

🤖 AI: "That's interesting. Can you tell me more about how 
        you evaluated which feature to prioritize?"

👤 User: "Sure, I used the RICE framework..."

🤖 AI: "Great use of a framework. What was the outcome of 
        that prioritization decision?"

👤 User: "We launched the feature and it increased..."

🤖 AI: "Excellent. Thank you for that detailed answer. 
        [Interview complete - showing feedback]"
```

---

## Next Steps

1. **Decision**: LangGraph vs Simple State Machine?
2. **Setup**: Get ElevenLabs API key
3. **Prototype**: Build basic flow (question → answer → response)
4. **Test**: Verify audio quality and latency
5. **Iterate**: Add clarifications, follow-ups, polish

---

## Questions to Consider

1. **Voice Selection**: Which ElevenLabs voice? (Professional, friendly, etc.)
2. **Interview Length**: How many follow-up questions?
3. **Clarification Limits**: Max clarifications per question?
4. **Fallback**: What if ElevenLabs is down? (Text-only mode?)
5. **Recording**: Should we save full interview audio?
6. **Analytics**: Track conversation patterns?

---

## Recommendation

**Start with LangGraph** because:
- Better long-term scalability
- More natural conversation handling
- Easier to add features later
- Industry-standard approach for conversational AI

**If time-constrained**: Start with simple state machine, migrate to LangGraph later.
