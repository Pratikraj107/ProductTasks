from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
from pathlib import Path
from agents.interview_feedback import InterviewFeedbackAgent
from pydantic import BaseModel

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
    ALLOWED_ORIGINS.extend([
        f"https://{PRODUCTION_DOMAIN}",
        f"https://www.{PRODUCTION_DOMAIN}",
        f"http://{PRODUCTION_DOMAIN}",
        f"http://www.{PRODUCTION_DOMAIN}"
    ])

# Add Railway frontend domain if provided
RAILWAY_FRONTEND = os.getenv("RAILWAY_FRONTEND_DOMAIN", "")
if RAILWAY_FRONTEND:
    ALLOWED_ORIGINS.append(RAILWAY_FRONTEND)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

