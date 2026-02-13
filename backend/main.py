from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
from pathlib import Path
from agents.interview_feedback import InterviewFeedbackAgent
from agents.communication_analyzer import CommunicationAnalyzer
from agents.script_generator import ScriptGenerator
from agents.audio_analyzer import AudioAnalyzer

# Try to import InterviewAgent (AI Interviewer with LangGraph)
try:
    from agents.interview_agent import InterviewAgent
    INTERVIEW_AGENT_AVAILABLE = True
except Exception as e:
    print(f"Warning: InterviewAgent not available: {e}")
    InterviewAgent = None
    INTERVIEW_AGENT_AVAILABLE = False
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# Import usage tracker router
try:
    from api.usage_tracker import router as usage_router
    USAGE_TRACKER_AVAILABLE = True
except Exception as e:
    print(f"Warning: Usage tracker not available: {e}")
    USAGE_TRACKER_AVAILABLE = False

# Import payments router
try:
    from api.payments import router as payments_router
    PAYMENTS_AVAILABLE = True
except Exception as e:
    print(f"Warning: Payments not available: {e}")
    PAYMENTS_AVAILABLE = False

# Import question answers router
try:
    from api.question_answers import router as answers_router
    ANSWERS_AVAILABLE = True
except Exception as e:
    print(f"Warning: Question answers not available: {e}")
    ANSWERS_AVAILABLE = False

# Try to import ResumeReviewAgent, but don't fail if it's not available
try:
    from agents.resume_reviewer import ResumeReviewAgent
    RESUME_AGENT_AVAILABLE = True
except Exception as e:
    print(f"Warning: ResumeReviewAgent not available: {e}")
    ResumeReviewAgent = None
    RESUME_AGENT_AVAILABLE = False

# Load .env file from the backend directory
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    try:
        load_dotenv(dotenv_path=env_path, encoding='utf-8')
    except (UnicodeDecodeError, Exception) as e:
        print(f"Warning: Could not load .env file (may be corrupted): {e}")
        print("Continuing without .env file. Make sure OPENAI_API_KEY is set as environment variable.")
else:
    print("No .env file found. Make sure OPENAI_API_KEY is set as environment variable.")

app = FastAPI(title="Resume Review API", version="1.0.0")

# CORS configuration
# Get allowed origins from environment or use defaults
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://localhost:5174"
).split(",")

# Add production domains if provided
PRODUCTION_DOMAIN = os.getenv("FRONTEND_DOMAIN", "")
if PRODUCTION_DOMAIN:
    # Remove protocol if present
    domain = PRODUCTION_DOMAIN.replace("https://", "").replace("http://", "").strip()
    ALLOWED_ORIGINS.extend([
        f"https://{domain}",
        f"https://www.{domain}",
        f"http://{domain}",
        f"http://www.{domain}"
    ])

# Add Railway frontend domain if provided
RAILWAY_FRONTEND = os.getenv("RAILWAY_FRONTEND_DOMAIN", "")
if RAILWAY_FRONTEND:
    ALLOWED_ORIGINS.append(RAILWAY_FRONTEND)

# Explicitly add producttasks.com if not already added
if "https://producttasks.com" not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.extend([
        "https://producttasks.com",
        "https://www.producttasks.com",
        "http://producttasks.com",
        "http://www.producttasks.com"
    ])

# Remove duplicates and empty strings
ALLOWED_ORIGINS = list(set([origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]))

# Log allowed origins for debugging (only in development or if DEBUG is set)
if os.getenv("DEBUG", "").lower() == "true":
    print(f"CORS Allowed Origins: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Initialize the agents
if RESUME_AGENT_AVAILABLE:
    try:
        review_agent = ResumeReviewAgent()
        agent_initialized = True
    except Exception as e:
        print(f"Warning: Could not initialize resume review agent: {e}")
        print("Make sure OPENAI_API_KEY is set in .env file")
        agent_initialized = False
        review_agent = None
else:
    agent_initialized = False
    review_agent = None

try:
    interview_agent = InterviewFeedbackAgent()
    interview_agent_initialized = True
except Exception as e:
    print(f"Warning: Could not initialize interview feedback agent: {e}")
    print("Make sure OPENAI_API_KEY is set in .env file")
    interview_agent_initialized = False
    interview_agent = None

try:
    communication_analyzer = CommunicationAnalyzer()
    communication_analyzer_initialized = True
except Exception as e:
    print(f"Warning: Could not initialize communication analyzer: {e}")
    print("Make sure OPENAI_API_KEY is set in .env file")
    communication_analyzer_initialized = False
    communication_analyzer = None

try:
    audio_analyzer = AudioAnalyzer()
    audio_analyzer_initialized = True
except Exception as e:
    print(f"Warning: Could not initialize audio analyzer: {e}")
    print("Make sure OPENAI_API_KEY is set and librosa/soundfile are installed")
    audio_analyzer_initialized = False
    audio_analyzer = None

# Initialize AI Interviewer Agent (LangGraph)
if INTERVIEW_AGENT_AVAILABLE:
    try:
        ai_interviewer = InterviewAgent()
        ai_interviewer_initialized = True
    except Exception as e:
        print(f"Warning: Could not initialize AI interviewer agent: {e}")
        print("Make sure OPENAI_API_KEY is set. ElevenLabs API key is optional.")
        ai_interviewer_initialized = False
        ai_interviewer = None
else:
    ai_interviewer_initialized = False
    ai_interviewer = None

try:
    script_generator = ScriptGenerator()
    script_generator_initialized = True
except Exception as e:
    print(f"Warning: Could not initialize script generator: {e}")
    print("Make sure OPENAI_API_KEY is set in .env file")
    script_generator_initialized = False
    script_generator = None

# Include usage tracker router if available
if USAGE_TRACKER_AVAILABLE:
    app.include_router(usage_router)

# Include payments router if available
if PAYMENTS_AVAILABLE:
    app.include_router(payments_router)

# Include question answers router if available
if ANSWERS_AVAILABLE:
    app.include_router(answers_router)

@app.get("/")
async def root():
    return {
        "message": "Resume Review API is running",
        "agent_initialized": agent_initialized
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "agent_ready": interview_agent_initialized,
        "resume_agent_ready": agent_initialized,
        "interview_agent_ready": interview_agent_initialized
    }

@app.post("/api/resume/review")
async def review_resume(file: UploadFile = File(...)):
    """
    Upload a resume PDF and get AI-powered review and suggestions
    """
    if not agent_initialized:
        raise HTTPException(
            status_code=503,
            detail="AI agent not initialized. Please check OPENAI_API_KEY in .env file"
        )
    
    try:
        # Validate file type
        if not file.filename or not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read file content
        contents = await file.read()
        
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Process with LangGraph agent
        result = await review_agent.review_resume(contents, file.filename)
        
        return JSONResponse(content=result)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

@app.post("/api/resume/review-text")
async def review_resume_text(resume_data: dict):
    """
    Review resume data that's already extracted (from frontend)
    """
    if not agent_initialized:
        raise HTTPException(
            status_code=503,
            detail="AI agent not initialized. Please check OPENAI_API_KEY in .env file"
        )
    
    try:
        if not resume_data:
            raise HTTPException(status_code=400, detail="Resume data is required")
        
        result = await review_agent.review_resume_data(resume_data)
        return JSONResponse(content=result)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error reviewing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error reviewing resume: {str(e)}")

# Interview feedback endpoints
class InterviewFeedbackRequest(BaseModel):
    question: str
    answer: str

@app.post("/api/interview/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribe audio file to text using OpenAI Whisper
    """
    if not interview_agent_initialized:
        raise HTTPException(
            status_code=503,
            detail="Interview agent not initialized. Please check OPENAI_API_KEY in .env file"
        )
    
    try:
        # Read audio file
        audio_bytes = await audio.read()
        
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Audio file is empty")
        
        # Get file extension
        filename = audio.filename or "audio.webm"
        
        # Transcribe
        transcript = await interview_agent.transcribe_audio_bytes(audio_bytes, filename)
        
        return JSONResponse(content={"transcript": transcript})
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error transcribing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}")

@app.post("/api/interview/feedback")
async def get_interview_feedback(request: InterviewFeedbackRequest):
    """
    Get AI feedback on an interview answer
    """
    if not interview_agent_initialized:
        raise HTTPException(
            status_code=503,
            detail="Interview agent not initialized. Please check OPENAI_API_KEY in .env file"
        )
    
    try:
        if not request.question or not request.answer:
            raise HTTPException(status_code=400, detail="Question and answer are required")
        
        feedback = await interview_agent.get_interview_feedback(request.question, request.answer)
        return JSONResponse(content=feedback)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting interview feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting interview feedback: {str(e)}")

# AI Interviewer endpoints (LangGraph-based conversational interview)
class StartInterviewRequest(BaseModel):
    question: str

class ProcessAnswerRequest(BaseModel):
    session_state: Dict[str, Any]  # Current interview state
    user_answer: str  # Transcribed user answer
    is_clarification_request: Optional[bool] = False  # Explicit clarification flag

@app.post("/api/interview/ai/start")
async def start_ai_interview(request: StartInterviewRequest):
    """
    Start a new AI interviewer session
    Returns initial question with audio
    """
    if not ai_interviewer_initialized:
        raise HTTPException(
            status_code=503,
            detail="AI interviewer not initialized. Please check OPENAI_API_KEY in .env file"
        )
    
    try:
        if not request.question:
            raise HTTPException(status_code=400, detail="Question is required")
        
        # Start interview session
        result = await ai_interviewer.start_interview(request.question)
        
        # Convert audio bytes to base64 for JSON response
        audio_base64 = None
        if result.get("audio_data"):
            import base64
            audio_bytes = result["audio_data"]
            print(f"Audio data size: {len(audio_bytes)} bytes")
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            print(f"Audio base64 length: {len(audio_base64)} characters")
        else:
            print("WARNING: No audio_data in result")
            print(f"Result keys: {result.keys()}")
        
        response_data = {
            "question": result["question"],
            "interviewer_response": result["interviewer_response"],
            "audio_base64": audio_base64,
            "conversation_history": result["conversation_history"],
            "current_stage": result["current_stage"],
            "session_state": {
                "question": result["question"],
                "conversation_history": result["conversation_history"],
                "current_stage": result["current_stage"],
                "follow_up_count": 0,
                "interview_complete": False
            }
        }
        
        print(f"Response data keys: {response_data.keys()}, has audio_base64: {audio_base64 is not None}")
        return JSONResponse(content=response_data)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error starting AI interview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error starting AI interview: {str(e)}")

@app.post("/api/interview/ai/process")
async def process_ai_interview_answer(request: ProcessAnswerRequest):
    """
    Process user's answer and get next interviewer response
    """
    if not ai_interviewer_initialized:
        raise HTTPException(
            status_code=503,
            detail="AI interviewer not initialized. Please check OPENAI_API_KEY in .env file"
        )
    
    try:
        if not request.user_answer:
            raise HTTPException(status_code=400, detail="User answer is required")
        
        if not request.session_state:
            raise HTTPException(status_code=400, detail="Session state is required")
        
        # Process user response
        result = await ai_interviewer.process_user_response(
            request.session_state,
            request.user_answer,
            is_clarification_request=request.is_clarification_request or False
        )
        
        # Convert audio bytes to base64
        audio_base64 = None
        if result.get("audio_data"):
            import base64
            audio_base64 = base64.b64encode(result["audio_data"]).decode('utf-8')
        
        return JSONResponse(content={
            "interviewer_response": result["interviewer_response"],
            "audio_base64": audio_base64,
            "conversation_history": result["conversation_history"],
            "current_stage": result["current_stage"],
            "interview_complete": result.get("interview_complete", False),
            "session_state": {
                "question": result["question"],
                "conversation_history": result["conversation_history"],
                "current_stage": result["current_stage"],
                "follow_up_count": result.get("follow_up_count", 0),
                "interview_complete": result.get("interview_complete", False)
            }
        })
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing AI interview answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing AI interview answer: {str(e)}")

# Communication Lab endpoints
class CompressAnswerRequest(BaseModel):
    question: str
    answer: str

class AnalyzePresenceRequest(BaseModel):
    prompt: str
    transcript: str
    audio_duration: float = 0
    is_reading_script: bool = False  # True when user is reading AI-generated script

@app.post("/api/communication/compress-answer")
async def compress_answer(request: CompressAnswerRequest):
    """
    Compress an answer to 2 minutes and 60 seconds, analyzing improvements
    """
    if not communication_analyzer_initialized:
        raise HTTPException(
            status_code=503,
            detail="Communication analyzer not initialized. Please check OPENAI_API_KEY in .env file"
        )
    
    try:
        if not request.question or not request.answer:
            raise HTTPException(status_code=400, detail="Question and answer are required")
        
        result = await communication_analyzer.compress_answer(request.question, request.answer)
        return JSONResponse(content=result)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error compressing answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error compressing answer: {str(e)}")

@app.post("/api/communication/analyze-presence")
async def analyze_presence(request: AnalyzePresenceRequest):
    """
    Analyze speech patterns for executive presence (transcript-based)
    """
    if not communication_analyzer_initialized:
        raise HTTPException(
            status_code=503,
            detail="Communication analyzer not initialized. Please check OPENAI_API_KEY in .env file"
        )
    
    try:
        if not request.prompt or not request.transcript:
            raise HTTPException(status_code=400, detail="Prompt and transcript are required")
        
        # Validate transcript is not empty
        if not request.transcript.strip():
            raise HTTPException(status_code=400, detail="Transcript cannot be empty. Please ensure your recording was captured correctly.")
        
        # Validate duration is reasonable (at least 1 second)
        if request.audio_duration < 1:
            # If duration is too short, estimate from transcript length
            word_count = len(request.transcript.split())
            estimated_duration = word_count / 150  # Estimate at 150 WPM
            request.audio_duration = max(estimated_duration, 1.0)
        
        result = await communication_analyzer.analyze_presence(
            request.prompt,
            request.transcript,
            request.audio_duration,
            request.is_reading_script
        )
        return JSONResponse(content=result)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error analyzing presence: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing presence: {str(e)}")

@app.post("/api/communication/analyze-presence-audio")
async def analyze_presence_with_audio(
    audio: UploadFile = File(...),
    prompt: str = Form(None),
    transcript: str = Form(None),
    audio_duration: float = Form(0),
    is_reading_script: bool = Form(True)
):
    """
    Analyze speech patterns for executive presence using audio file analysis.
    Used when reading script - provides voice-based feedback with scores.
    """
    if not audio_analyzer_initialized:
        raise HTTPException(
            status_code=503,
            detail="Audio analyzer not initialized. Please check OPENAI_API_KEY and ensure librosa/soundfile are installed"
        )
    
    try:
        # Read audio file
        audio_bytes = await audio.read()
        
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Audio file is empty")
        
        # File size validation (15MB max - allows for 10 min audio at reasonable quality)
        MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB
        if len(audio_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"Audio file too large ({len(audio_bytes) / (1024*1024):.1f}MB). Maximum size is 15MB. Please use a shorter recording or lower quality."
            )
        
        # Perform audio analysis
        audio_analysis = await audio_analyzer.analyze_audio(
            audio_bytes, 
            audio.filename or "audio.webm"
        )
        
        # Get transcript-based analysis for fillers, qualifiers, etc. (if transcript provided)
        transcript_analysis = {}
        if transcript and communication_analyzer_initialized:
            try:
                transcript_analysis = await communication_analyzer.analyze_presence(
                    prompt or "",
                    transcript,
                    audio_duration if audio_duration > 0 else audio_analysis.get("duration", 0),
                    is_reading_script
                )
            except Exception as e:
                print(f"Warning: Transcript analysis failed: {str(e)}")
        
        # Merge analyses - audio analysis takes precedence for delivery metrics
        result = {
            **transcript_analysis,  # Fillers, qualifiers, confidence from transcript
            **audio_analysis  # Tone, pace, clarity, emphasis, pauses, voice quality from audio
        }
        
        # Update overall assessment to focus on delivery when reading script
        if is_reading_script and "overall_assessment" in result:
            result["overall_assessment"] = "This analysis focuses on speech delivery only. Content quality is not evaluated as you were reading an AI-generated script."
        
        return JSONResponse(content=result)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error analyzing audio presence: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing audio presence: {str(e)}")

# Script Generation endpoints
class GenerateScriptRequest(BaseModel):
    script_type: str  # 'interview_question', 'presentation_prompt', 'star_scenario', 'elevator_pitch'

class GenerateCompleteAnswerRequest(BaseModel):
    script_content: str
    script_type: str
    sections: Optional[List[Dict[str, Any]]] = None
    key_points: Optional[List[str]] = None
    tips: Optional[List[str]] = None

@app.post("/api/communication/generate-script")
async def generate_script(request: GenerateScriptRequest):
    """
    Generate a practice script for communication lab and save it to database
    """
    print(f"[DEBUG] Received generate-script request for type: {request.script_type}")
    
    if not script_generator_initialized:
        print("[ERROR] Script generator not initialized")
        raise HTTPException(
            status_code=503,
            detail="Script generator not initialized. Please check OPENAI_API_KEY in .env file"
        )
    
    try:
        valid_types = ['interview_question', 'presentation_prompt', 'star_scenario', 'elevator_pitch']
        if request.script_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid script_type. Must be one of: {valid_types}")
        
        print(f"[DEBUG] Starting script generation for type: {request.script_type}")
        
        # Generate the script with timeout handling
        import asyncio
        try:
            result = await asyncio.wait_for(
                script_generator.generate_script(request.script_type),
                timeout=70.0  # 70 seconds total timeout (60s for API + 10s buffer)
            )
            print(f"[DEBUG] Script generation completed successfully")
        except asyncio.TimeoutError:
            print("[ERROR] Script generation timed out after 70 seconds")
            raise HTTPException(
                status_code=504,
                detail="Script generation timed out. The request took too long. Please try again."
            )
        
        # Save to database if Supabase is configured (non-blocking, don't wait)
        try:
            SUPABASE_URL = os.getenv("SUPABASE_URL")
            SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if SUPABASE_URL and SUPABASE_KEY:
                from supabase import create_client
                supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
                
                # Insert script into database (fire and forget - don't block response)
                try:
                    supabase.table("practice_scripts").insert({
                        "script_type": result["script_type"],
                        "title": result["title"],
                        "script_content": result["script_content"],
                        "tips": result.get("tips", []),
                        "key_points": result.get("key_points", []),
                        "estimated_time": result.get("estimated_time"),
                        "sections": result.get("sections", [])
                    }).execute()
                except Exception as db_insert_error:
                    # Don't fail if database save fails, just log it
                    print(f"Warning: Could not save script to database: {str(db_insert_error)}")
        except Exception as db_error:
            # Don't fail if database connection fails, just log it
            print(f"Warning: Database not available: {str(db_error)}")
        
        return JSONResponse(content=result)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating script: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating script: {str(e)}")

@app.post("/api/communication/generate-complete-answer")
async def generate_complete_answer(request: GenerateCompleteAnswerRequest):
    """
    Generate a complete answer/script based on script structure for user to read while practicing
    """
    if not script_generator_initialized:
        raise HTTPException(
            status_code=503,
            detail="Script generator not initialized. Please check OPENAI_API_KEY in .env file"
        )
    
    try:
        if not request.script_content:
            raise HTTPException(status_code=400, detail="Script content is required")
        
        complete_answer = await script_generator.generate_complete_answer(
            request.script_content,
            request.script_type,
            request.sections or [],
            request.key_points or [],
            request.tips or []
        )
        
        return JSONResponse(content={"complete_answer": complete_answer})
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating complete answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating complete answer: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

