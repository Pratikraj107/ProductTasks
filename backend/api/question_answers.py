"""
Question Answers API endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os

# Unset proxy environment variables before importing Supabase
_proxy_vars = ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"]
_original_proxy_values = {}
for var in _proxy_vars:
    if var in os.environ:
        _original_proxy_values[var] = os.environ.pop(var)

from supabase import create_client, Client

router = APIRouter(prefix="/api/answers", tags=["answers"])

# Initialize Supabase client (lazy initialization)
def get_supabase_client() -> Client:
    """Get Supabase client, creating it if needed"""
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key for backend operations

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables")

    # Ensure proxy vars are still unset (they should be from module-level unset)
    for var in _proxy_vars:
        if var in os.environ:
            del os.environ[var]
    
    # Create client - proxy vars are already unset at module level
    return create_client(SUPABASE_URL, SUPABASE_KEY)

class GenerateAnswerRequest(BaseModel):
    question: str
    question_id: int
    question_index: int

class GetAnswerRequest(BaseModel):
    question_id: int
    question_index: int

class AnswerResponse(BaseModel):
    answer: Optional[str] = None
    exists: bool

@router.get("/{question_id}/{question_index}")
async def get_answer(question_id: int, question_index: int):
    """
    Get saved answer for a question, if it exists
    """
    try:
        supabase = get_supabase_client()
        
        # Try to get existing answer
        result = supabase.table("question_answers").select("*").eq("question_id", question_id).eq("question_index", question_index).maybe_single().execute()
        
        if result.data:
            return AnswerResponse(answer=result.data["answer"], exists=True)
        else:
            return AnswerResponse(answer=None, exists=False)
    
    except Exception as e:
        print(f"Error getting answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting answer: {str(e)}")

@router.post("/generate")
async def generate_and_save_answer(request: GenerateAnswerRequest):
    """
    Generate an ideal answer using AI and save it to the database
    """
    try:
        # Import here to avoid circular dependency
        from agents.interview_feedback import InterviewFeedbackAgent
        
        # Check if interview agent is initialized
        try:
            interview_agent = InterviewFeedbackAgent()
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Interview agent not initialized: {str(e)}"
            )
        
        # Generate answer using AI
        answer = await interview_agent.generate_ideal_answer(request.question)
        
        # Save to database
        supabase = get_supabase_client()
        
        # Check if answer already exists
        existing = supabase.table("question_answers").select("*").eq("question_id", request.question_id).eq("question_index", request.question_index).maybe_single().execute()
        
        if existing.data:
            # Update existing answer
            supabase.table("question_answers").update({
                "answer": answer,
                "updated_at": "now()"
            }).eq("question_id", request.question_id).eq("question_index", request.question_index).execute()
        else:
            # Insert new answer
            supabase.table("question_answers").insert({
                "question_id": request.question_id,
                "question_index": request.question_index,
                "answer": answer
            }).execute()
        
        return {"answer": answer, "saved": True}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")
