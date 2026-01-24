from openai import OpenAI
import os
from dotenv import load_dotenv
from pathlib import Path
from typing import Dict, Any
import json

# Load .env file from the backend directory
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    try:
        load_dotenv(dotenv_path=env_path, encoding='utf-8')
    except (UnicodeDecodeError, Exception) as e:
        print(f"Warning: Could not load .env file (may be corrupted): {e}")
        print("Continuing without .env file. Make sure OPENAI_API_KEY is set as environment variable.")
else:
    print("No .env file found. Make sure OPENAI_API_KEY is set as environment variable.")

class InterviewFeedbackAgent:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        # Initialize OpenAI client
        # Railway might set proxy environment variables that the OpenAI client tries to use
        # We need to explicitly disable proxy usage or handle it properly
        try:
            # Try standard initialization first
            self.openai_client = OpenAI(api_key=api_key)
        except (TypeError, ValueError) as e:
            # If that fails due to proxy issues, try with explicit http_client configuration
            # This bypasses any automatic proxy detection
            import httpx
            http_client = httpx.Client(timeout=60.0)
            self.openai_client = OpenAI(
                api_key=api_key,
                http_client=http_client
            )
        
        self.model = "gpt-4o-mini"
    
    async def transcribe_audio(self, audio_file_path: str) -> str:
        """
        Transcribe audio file to text using OpenAI Whisper API
        """
        try:
            with open(audio_file_path, "rb") as audio_file:
                transcript = self.openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
            return transcript
        except Exception as e:
            raise Exception(f"Error transcribing audio: {str(e)}")
    
    async def transcribe_audio_bytes(self, audio_bytes: bytes, filename: str = "audio.webm") -> str:
        """
        Transcribe audio bytes to text using OpenAI Whisper API
        """
        try:
            # Create a temporary file-like object
            import io
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = filename
            
            transcript = self.openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
            return transcript
        except Exception as e:
            raise Exception(f"Error transcribing audio: {str(e)}")
    
    async def get_interview_feedback(
        self, 
        question: str, 
        answer: str
    ) -> Dict[str, Any]:
        """
        Get comprehensive feedback on an interview answer
        """
        feedback_prompt = f"""You are an expert Product Management interview coach with 15+ years of experience conducting PM interviews at top tech companies.

Evaluate this interview answer and provide comprehensive feedback.

INTERVIEW QUESTION:
{question}

CANDIDATE'S ANSWER:
{answer}

Provide detailed feedback covering the following areas:

1. **Clarity & Communication**
   - How clear and articulate was the answer?
   - Was the response easy to follow?
   - Any issues with structure or flow?

2. **Content Quality**
   - Did the answer address the question directly?
   - Was the content relevant and substantive?
   - Were examples and details appropriate?

3. **Completeness**
   - Did the answer fully address all aspects of the question?
   - Were important points missing?
   - Was the answer too brief or too lengthy?

4. **PM Framework Usage**
   - Did the candidate use appropriate PM frameworks (CIRCLES, AARM, STAR, etc.)?
   - Was the framework applied correctly?
   - Could better frameworks have been used?

5. **Overall Assessment**
   - Strengths of the answer
   - Areas for improvement
   - Specific actionable recommendations

Format your response as a structured JSON object with this exact structure:
{{
  "clarity": {{
    "score": <number 0-10>,
    "feedback": "<detailed feedback text>",
    "strengths": ["<strength1>", "<strength2>"],
    "improvements": ["<improvement1>", "<improvement2>"]
  }},
  "content": {{
    "score": <number 0-10>,
    "feedback": "<detailed feedback text>",
    "strengths": ["<strength1>", "<strength2>"],
    "improvements": ["<improvement1>", "<improvement2>"]
  }},
  "completeness": {{
    "score": <number 0-10>,
    "feedback": "<detailed feedback text>",
    "strengths": ["<strength1>", "<strength2>"],
    "improvements": ["<improvement1>", "<improvement2>"]
  }},
  "frameworks": {{
    "score": <number 0-10>,
    "feedback": "<detailed feedback text>",
    "frameworks_used": ["<framework1>", "<framework2>"],
    "frameworks_recommended": ["<framework1>", "<framework2>"],
    "strengths": ["<strength1>", "<strength2>"],
    "improvements": ["<improvement1>", "<improvement2>"]
  }},
  "overall": {{
    "score": <number 0-10>,
    "summary": "<overall summary of the answer>",
    "strengths": ["<strength1>", "<strength2>", "<strength3>"],
    "improvements": ["<improvement1>", "<improvement2>", "<improvement3>"],
    "recommendations": ["<recommendation1>", "<recommendation2>", "<recommendation3>"]
  }}
}}

Return ONLY valid JSON, no additional text or markdown formatting."""

        messages = [
            {"role": "system", "content": "You are an expert Product Management interview coach. Always respond with valid JSON only."},
            {"role": "user", "content": feedback_prompt}
        ]
        
        response = self.openai_client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.3
        )
        content = response.choices[0].message.content.strip()
        
        # Parse the response
        try:
            # Try to extract JSON from response
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0].strip()
            else:
                json_str = content
            
            # Remove any leading/trailing whitespace
            json_str = json_str.strip()
            
            import json
            feedback_data = json.loads(json_str)
            
            return feedback_data
        except Exception as e:
            # Fallback if JSON parsing fails
            print(f"JSON parsing error: {e}")
            print(f"Response content: {content[:500]}")
            return {
                "clarity": {
                    "score": 7,
                    "feedback": "Unable to parse detailed feedback. Please try again.",
                    "strengths": [],
                    "improvements": []
                },
                "content": {
                    "score": 7,
                    "feedback": "Unable to parse detailed feedback. Please try again.",
                    "strengths": [],
                    "improvements": []
                },
                "completeness": {
                    "score": 7,
                    "feedback": "Unable to parse detailed feedback. Please try again.",
                    "strengths": [],
                    "improvements": []
                },
                "frameworks": {
                    "score": 7,
                    "feedback": "Unable to parse detailed feedback. Please try again.",
                    "frameworks_used": [],
                    "frameworks_recommended": [],
                    "strengths": [],
                    "improvements": []
                },
                "overall": {
                    "score": 7,
                    "summary": "Feedback parsing error occurred.",
                    "strengths": [],
                    "improvements": [],
                    "recommendations": []
                }
            }
    
    async def generate_ideal_answer(self, question: str) -> str:
        """
        Generate an ideal/example answer for an interview question
        """
        answer_prompt = f"""You are an expert Product Management interview coach with 15+ years of experience at top tech companies (Google, Meta, Amazon, Microsoft, etc.).

Generate a comprehensive, well-structured ideal answer for this Product Management interview question. The answer should:

1. **Be Clear and Structured**: Use appropriate PM frameworks (CIRCLES, AARM, STAR, etc.) where relevant
2. **Be Comprehensive**: Cover all aspects of the question thoroughly
3. **Include Examples**: Provide concrete examples and real-world scenarios
4. **Be Professional**: Use industry-standard terminology and best practices
5. **Be Actionable**: Show how a senior PM would approach this question

INTERVIEW QUESTION:
{question}

Provide a detailed, well-structured answer that demonstrates:
- Strong product thinking
- Clear communication
- Use of relevant PM frameworks
- Real-world examples
- Strategic thinking
- Technical understanding (if applicable)

Format your answer as a clear, well-structured response that a candidate could use as a reference. Do not include any meta-commentary or explanations about the answer itself - just provide the ideal answer directly."""

        messages = [
            {"role": "system", "content": "You are an expert Product Management interview coach. Generate comprehensive, well-structured ideal answers for PM interview questions."},
            {"role": "user", "content": answer_prompt}
        ]
        
        response = self.openai_client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7
        )
        answer = response.choices[0].message.content.strip()
        
        return answer
