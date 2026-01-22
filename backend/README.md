# Resume Review API

FastAPI backend with LangGraph agent for AI-powered resume review.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=sk-your-key-here
```

4. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /api/resume/review` - Upload PDF and get AI review
- `POST /api/resume/review-text` - Review extracted resume data

## Testing

Test the API:
```bash
curl -X POST "http://localhost:8000/api/resume/review-text" \
  -H "Content-Type: application/json" \
  -d '{"personalInfo": {"fullName": "Test User"}, "experiences": [], "educations": []}'
```

