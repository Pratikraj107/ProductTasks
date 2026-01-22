# Quick Start Guide

## 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## 2. Set Up Environment Variables

Create a `.env` file in the `backend` folder:

```bash
# Copy the example file
cp .env.example .env
```

Then edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

Get your API key from: https://platform.openai.com/api-keys

## 3. Start the FastAPI Server

```bash
# From the backend directory
uvicorn main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`

You can test it by visiting: `http://localhost:8000` in your browser

## 4. Start Your React Frontend

In a separate terminal, from the project root:

```bash
npm run dev
```

## 5. Use AI Review Feature

1. Go to the Resume page
2. Fill in your resume information (or upload a PDF)
3. Click the "AI Review" button (purple/pink button)
4. Wait for the analysis (takes 10-30 seconds)
5. Review the suggestions and improvements

## Troubleshooting

### "AI agent not initialized" error
- Make sure you've created the `.env` file
- Check that `OPENAI_API_KEY` is set correctly
- Restart the FastAPI server after adding the key

### CORS errors
- Make sure FastAPI is running on port 8000
- Check that your React app is running on the allowed origins (localhost:5174, 5173, or 3000)

### Connection refused
- Verify the FastAPI server is running
- Check the console for any error messages
- Make sure port 8000 is not being used by another application

## API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /api/resume/review` - Upload PDF and get AI review
- `POST /api/resume/review-text` - Review extracted resume data

## Next Steps

- Customize the AI prompts in `agents/resume_reviewer.py`
- Adjust the model (gpt-4o-mini vs gpt-4) for better quality vs cost
- Add more features like resume comparison, job matching, etc.

