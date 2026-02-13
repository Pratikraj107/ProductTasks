# ElevenLabs API Key Setup

## Where to Add Your ElevenLabs API Key

### Option 1: Backend `.env` File (Recommended for Local Development)

Add the following to your `backend/.env` file:

```bash
# ElevenLabs API Key for AI Interviewer Text-to-Speech
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Optional: Custom Voice ID (defaults to professional voice if not set)
# ELEVENLABS_VOICE_ID=your_voice_id_here
```

**Location**: `backend/.env`

### Option 2: Railway Environment Variables (For Production)

1. Go to your Railway dashboard
2. Select your **Backend Service**
3. Go to **Variables** tab
4. Click **+ New Variable**
5. Add:
   - **Name**: `ELEVENLABS_API_KEY`
   - **Value**: Your ElevenLabs API key
6. (Optional) Add `ELEVENLABS_VOICE_ID` if you want a custom voice

## Getting Your ElevenLabs API Key

1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Go to your profile/settings
3. Copy your API key
4. Add it to your `.env` file or Railway variables

## Free Tier Limits

- **Free Tier**: 10,000 characters/month
- **Starter**: $5/month - 30,000 characters
- **Creator**: $22/month - 100,000 characters

For MVP testing, the free tier should be sufficient.

## Voice Selection

The default voice is a professional interviewer voice. You can:
1. Browse voices in ElevenLabs dashboard
2. Copy the Voice ID
3. Set `ELEVENLABS_VOICE_ID` in your `.env` file

## Testing

After adding the API key:
1. Restart your backend server
2. Try starting an AI interview
3. You should hear the AI interviewer speak the question

## Troubleshooting

### Error: "ELEVENLABS_API_KEY not found"
- Make sure the key is in `backend/.env` file
- Restart the backend server after adding
- Check for typos in the variable name

### Error: "elevenlabs package is not installed"
- Run: `pip install elevenlabs>=0.2.27`
- Make sure you're in the backend directory

### No Audio Generated
- Check your API key is valid
- Verify you have characters remaining in your ElevenLabs account
- Check backend logs for specific error messages
