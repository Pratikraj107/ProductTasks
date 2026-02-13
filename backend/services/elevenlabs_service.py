"""
ElevenLabs Text-to-Speech Service
Handles conversion of text to speech using ElevenLabs API
"""
import os
from typing import Optional
import io

try:
    from elevenlabs import generate, set_api_key, Voice, VoiceSettings
    ELEVENLABS_AVAILABLE = True
except ImportError:
    ELEVENLABS_AVAILABLE = False
    print("Warning: elevenlabs not installed. Install with: pip install elevenlabs")


class ElevenLabsService:
    """
    Service for converting text to speech using ElevenLabs API
    """
    
    def __init__(self):
        if not ELEVENLABS_AVAILABLE:
            raise ImportError("elevenlabs package is not installed. Install with: pip install elevenlabs")
        
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            raise ValueError("ELEVENLABS_API_KEY not found in environment variables")
        
        set_api_key(api_key)
        
        # Default voice ID - can be overridden via environment variable
        # You can find voice IDs in ElevenLabs dashboard
        self.voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default: Rachel (professional)
        
        # Voice settings for natural speech
        self.voice_settings = VoiceSettings(
            stability=0.5,
            similarity_boost=0.75,
            style=0.0,
            use_speaker_boost=True
        )
    
    async def text_to_speech(self, text: str, voice_id: Optional[str] = None) -> bytes:
        """
        Convert text to speech audio
        
        Args:
            text: Text to convert to speech
            voice_id: Optional voice ID override
            
        Returns:
            bytes: Audio data (MP3 format)
        """
        if not ELEVENLABS_AVAILABLE:
            raise RuntimeError("ElevenLabs service is not available")
        
        try:
            voice_id_to_use = voice_id or self.voice_id
            
            # Generate audio - use the simpler API call
            audio = generate(
                text=text,
                voice=voice_id_to_use,
                model="eleven_multilingual_v2"  # Supports multiple languages
            )
            
            # Convert generator to bytes
            audio_bytes = b"".join(audio)
            
            return audio_bytes
            
        except Exception as e:
            raise Exception(f"Error generating speech: {str(e)}")
    
    def get_available_voices(self):
        """
        Get list of available voices (for testing/selection)
        Note: This requires additional API call - implement if needed
        """
        # This would require the elevenlabs client to list voices
        # For now, we'll use the voice_id from environment
        pass
