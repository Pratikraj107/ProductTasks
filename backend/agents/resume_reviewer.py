from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from typing import TypedDict, List
import PyPDF2
import io
import os
from dotenv import load_dotenv
from pathlib import Path
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

# Define the agent state
class ReviewState(TypedDict):
    resume_text: str
    resume_data: dict
    analysis: str
    suggestions: List[str]
    strengths: List[str]
    improvements: List[str]
    score: float

class ResumeReviewAgent:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",  # or "gpt-4" for better quality
            temperature=0.3,
            api_key=api_key
        )
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow"""
        workflow = StateGraph(ReviewState)
        
        # Add nodes
        workflow.add_node("extract_text", self._extract_text)
        workflow.add_node("analyze_resume", self._analyze_resume)
        workflow.add_node("generate_suggestions", self._generate_suggestions)
        workflow.add_node("calculate_score", self._calculate_score)
        
        # Define the flow
        workflow.set_entry_point("extract_text")
        workflow.add_edge("extract_text", "analyze_resume")
        workflow.add_edge("analyze_resume", "generate_suggestions")
        workflow.add_edge("generate_suggestions", "calculate_score")
        workflow.add_edge("calculate_score", END)
        
        return workflow.compile()
    
    def _extract_text(self, state: ReviewState) -> ReviewState:
        """Extract text from PDF"""
        try:
            resume_content = state.get("resume_text", b"")
            if isinstance(resume_content, bytes):
                pdf_file = io.BytesIO(resume_content)
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                
                return {
                    **state,
                    "resume_text": text
                }
            else:
                return state
        except Exception as e:
            return {
                **state,
                "resume_text": f"Error extracting text: {str(e)}"
            }
    
    def _analyze_resume(self, state: ReviewState) -> ReviewState:
        """Analyze the resume content"""
        resume_text = state.get("resume_text", "")
        resume_data = state.get("resume_data", {})
        
        analysis_prompt = f"""You are an expert resume reviewer and career coach. Analyze this resume and provide a comprehensive review.

Resume Content:
{resume_text[:3000]}

Resume Data (if available):
{json.dumps(resume_data, indent=2) if resume_data else "None"}

Provide a detailed analysis covering:
1. Overall structure and formatting
2. Content quality and clarity
3. Key strengths
4. Areas for improvement
5. Missing elements
6. Industry-specific feedback for Product Management roles

Format your response as a structured analysis with clear sections."""

        messages = [
            SystemMessage(content="You are an expert resume reviewer with 15+ years of experience in HR and recruitment, specializing in Product Management and Tech roles."),
            HumanMessage(content=analysis_prompt)
        ]
        
        response = self.llm.invoke(messages)
        analysis = response.content
        
        return {
            **state,
            "analysis": analysis
        }
    
    def _generate_suggestions(self, state: ReviewState) -> ReviewState:
        """Generate actionable suggestions"""
        analysis = state.get("analysis", "")
        resume_text = state.get("resume_text", "")
        
        suggestions_prompt = f"""Based on this resume analysis:

{analysis}

Resume Content (first 2000 chars):
{resume_text[:2000]}

Generate a JSON response with exactly this structure:
{{
  "suggestions": ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5"],
  "strengths": ["strength1", "strength2", "strength3", "strength4", "strength5"],
  "improvements": ["improvement1", "improvement2", "improvement3", "improvement4", "improvement5"]
}}

Provide:
1. Top 5 specific, actionable suggestions for improvement
2. Top 5 key strengths to highlight
3. Top 5 areas that need improvement

Return ONLY valid JSON, no additional text."""

        messages = [
            SystemMessage(content="You are a career coach providing actionable resume improvement advice. Always respond with valid JSON only."),
            HumanMessage(content=suggestions_prompt)
        ]
        
        response = self.llm.invoke(messages)
        content = response.content.strip()
        
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
            
            suggestions_data = json.loads(json_str)
            
            return {
                **state,
                "suggestions": suggestions_data.get("suggestions", [])[:5],
                "strengths": suggestions_data.get("strengths", [])[:5],
                "improvements": suggestions_data.get("improvements", [])[:5]
            }
        except json.JSONDecodeError as e:
            # Fallback if JSON parsing fails
            print(f"JSON parsing error: {e}")
            print(f"Response content: {content[:500]}")
            return {
                **state,
                "suggestions": ["Review formatting and structure", "Enhance key achievements with metrics", "Improve summary section", "Add relevant keywords", "Strengthen experience descriptions"],
                "strengths": ["Good content structure", "Relevant experience", "Clear formatting"],
                "improvements": ["Add quantifiable achievements", "Improve summary", "Enhance skills section"]
            }
    
    def _calculate_score(self, state: ReviewState) -> ReviewState:
        """Calculate an overall resume score"""
        analysis = state.get("analysis", "")
        strengths = state.get("strengths", [])
        improvements = state.get("improvements", [])
        
        score_prompt = f"""Based on this resume analysis, provide an overall score from 0-100.

Analysis Summary: {analysis[:500]}
Number of Strengths: {len(strengths)}
Number of Improvements needed: {len(improvements)}

Consider:
- Content quality and relevance
- Structure and formatting
- Completeness
- Industry standards for Product Management resumes

Provide ONLY a number between 0-100 representing the resume quality score. No explanation, just the number."""

        messages = [
            SystemMessage(content="You are a resume scoring expert. Respond with only a number between 0-100."),
            HumanMessage(content=score_prompt)
        ]
        
        response = self.llm.invoke(messages)
        
        try:
            # Extract number from response
            score_text = response.content.strip()
            # Remove any non-numeric characters except decimal point
            score_text = ''.join(c for c in score_text if c.isdigit() or c == '.')
            score = float(score_text) if score_text else 75.0
            score = max(0, min(100, score))  # Clamp between 0-100
        except:
            score = 75.0  # Default score
        
        return {
            **state,
            "score": round(score, 1)
        }
    
    async def review_resume(self, pdf_content: bytes, filename: str) -> dict:
        """Main method to review a resume PDF"""
        initial_state = {
            "resume_text": pdf_content,
            "resume_data": {},
            "analysis": "",
            "suggestions": [],
            "strengths": [],
            "improvements": [],
            "score": 0.0
        }
        
        # Run the graph
        final_state = await self.graph.ainvoke(initial_state)
        
        return {
            "analysis": final_state.get("analysis", ""),
            "suggestions": final_state.get("suggestions", []),
            "strengths": final_state.get("strengths", []),
            "improvements": final_state.get("improvements", []),
            "score": final_state.get("score", 0.0),
            "filename": filename
        }
    
    async def review_resume_data(self, resume_data: dict) -> dict:
        """Review resume data that's already extracted"""
        resume_text = self._format_resume_data(resume_data)
        
        initial_state = {
            "resume_text": resume_text.encode(),
            "resume_data": resume_data,
            "analysis": "",
            "suggestions": [],
            "strengths": [],
            "improvements": [],
            "score": 0.0
        }
        
        final_state = await self.graph.ainvoke(initial_state)
        
        return {
            "analysis": final_state.get("analysis", ""),
            "suggestions": final_state.get("suggestions", []),
            "strengths": final_state.get("strengths", []),
            "improvements": final_state.get("improvements", []),
            "score": final_state.get("score", 0.0)
        }
    
    def _format_resume_data(self, data: dict) -> str:
        """Format resume data dict into text"""
        personal = data.get('personalInfo', {})
        text = f"""
RESUME INFORMATION

PERSONAL INFORMATION:
Name: {personal.get('fullName', 'N/A')}
Email: {personal.get('email', 'N/A')}
Phone: {personal.get('phone', 'N/A')}
Location: {personal.get('location', 'N/A')}
LinkedIn: {personal.get('linkedin', 'N/A')}
Portfolio: {personal.get('portfolio', 'N/A')}

PROFESSIONAL SUMMARY:
{personal.get('summary', 'N/A')}

WORK EXPERIENCE:
{self._format_experiences(data.get('experiences', []))}

EDUCATION:
{self._format_educations(data.get('educations', []))}

SKILLS:
{data.get('skills', 'N/A')}

PROJECTS:
{self._format_projects(data.get('projects', []))}

CERTIFICATIONS:
{self._format_certifications(data.get('certifications', []))}
"""
        return text
    
    def _format_experiences(self, experiences: list) -> str:
        if not experiences:
            return "None listed"
        result = []
        for exp in experiences:
            position = exp.get('position', 'Position')
            company = exp.get('company', 'Company')
            start = exp.get('startDate', '')
            end = 'Present' if exp.get('current') else exp.get('endDate', '')
            desc = exp.get('description', '')
            
            result.append(f"- {position} at {company}")
            if start or end:
                result.append(f"  Period: {start} - {end}")
            if desc:
                result.append(f"  Description: {desc}")
            result.append("")
        return "\n".join(result)
    
    def _format_educations(self, educations: list) -> str:
        if not educations:
            return "None listed"
        result = []
        for edu in educations:
            degree = edu.get('degree', 'Degree')
            institution = edu.get('institution', 'Institution')
            field = edu.get('field', '')
            end = edu.get('endDate', '')
            gpa = edu.get('gpa', '')
            
            result.append(f"- {degree}")
            if field:
                result.append(f"  Field: {field}")
            result.append(f"  Institution: {institution}")
            if end:
                result.append(f"  Year: {end}")
            if gpa:
                result.append(f"  GPA: {gpa}")
            result.append("")
        return "\n".join(result)
    
    def _format_projects(self, projects: list) -> str:
        if not projects:
            return "None listed"
        result = []
        for proj in projects:
            name = proj.get('name', 'Project')
            desc = proj.get('description', '')
            tech = proj.get('technologies', '')
            
            result.append(f"- {name}")
            if desc:
                result.append(f"  Description: {desc}")
            if tech:
                result.append(f"  Technologies: {tech}")
            result.append("")
        return "\n".join(result)
    
    def _format_certifications(self, certifications: list) -> str:
        if not certifications:
            return "None listed"
        result = []
        for cert in certifications:
            name = cert.get('name', 'Certification')
            issuer = cert.get('issuer', '')
            date = cert.get('date', '')
            
            result.append(f"- {name}")
            if issuer:
                result.append(f"  Issuer: {issuer}")
            if date:
                result.append(f"  Date: {date}")
            result.append("")
        return "\n".join(result)

