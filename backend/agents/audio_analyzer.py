import os
import io
import numpy as np
from typing import Dict, Any, Optional
import librosa
import soundfile as sf
from scipy import signal
from openai import OpenAI

# Try to import pydub, but don't fail if it's not available
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    print("Warning: pydub not available. WebM conversion may not work. Install with: pip install pydub")

class AudioAnalyzer:
    """
    Analyzes audio recordings for speech delivery characteristics:
    - Tone/emotion (pitch, energy)
    - Pauses (location, duration)
    - Speaking pace/rhythm
    - Pronunciation/clarity
    - Emphasis and intonation
    - Voice quality (volume, clarity)
    """
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        self.openai_client = OpenAI(api_key=api_key)
    
    async def analyze_audio(self, audio_bytes: bytes, filename: str = "audio.webm") -> Dict[str, Any]:
        """
        Analyze audio file for speech delivery characteristics.
        Returns detailed analysis with scores (0-100) for each metric.
        """
        try:
            # Convert WebM/Opus to WAV format that librosa can read
            audio_file = io.BytesIO(audio_bytes)
            
            # Check if file is WebM or Opus format
            if filename.endswith('.webm') or filename.endswith('.opus') or 'webm' in filename.lower():
                if PYDUB_AVAILABLE:
                    try:
                        # Use pydub to convert WebM to WAV
                        audio_segment = AudioSegment.from_file(audio_file, format="webm")
                        # Convert to mono and export to WAV format in memory
                        audio_segment = audio_segment.set_channels(1)  # Convert to mono
                        wav_buffer = io.BytesIO()
                        audio_segment.export(wav_buffer, format="wav")
                        wav_buffer.seek(0)
                        # Now load with librosa
                        y, sr = librosa.load(wav_buffer, sr=None, duration=None)
                    except Exception as pydub_error:
                        print(f"Warning: pydub conversion failed: {pydub_error}")
                        raise Exception(f"Could not convert WebM audio file. Error: {pydub_error}. Make sure ffmpeg is installed: https://ffmpeg.org/download.html")
                else:
                    raise Exception("WebM audio format requires pydub library. Install with: pip install pydub. Also ensure ffmpeg is installed on your system.")
            else:
                # Try direct loading for other formats (WAV, MP3, etc.)
                try:
                    y, sr = librosa.load(audio_file, sr=None, duration=None)
                except Exception as e:
                    # Fallback to soundfile
                    audio_file.seek(0)
                    try:
                        y, sr = sf.read(audio_file)
                        if len(y.shape) > 1:
                            y = np.mean(y, axis=1)  # Convert to mono
                    except Exception as e2:
                        raise Exception(f"Could not load audio file. librosa error: {e}, soundfile error: {e2}")
            
            duration = len(y) / sr
            
            # Extract features
            features = self._extract_audio_features(y, sr, duration)
            
            # Get transcription with timestamps for pause analysis
            transcript_data = await self._get_transcription_with_timestamps(audio_bytes, filename)
            
            # Analyze pauses from timestamps
            pause_analysis = self._analyze_pauses(transcript_data, duration)
            
            # Combine all analyses
            analysis = {
                **features,
                **pause_analysis,
                "duration": duration,
                "sample_rate": sr
            }
            
            return analysis
            
        except Exception as e:
            raise Exception(f"Error analyzing audio: {str(e)}")
    
    def _extract_audio_features(self, y: np.ndarray, sr: int, duration: float) -> Dict[str, Any]:
        """Extract audio features for speech analysis"""
        
        # 1. Tone/Emotion Analysis (Pitch and Energy)
        pitch = librosa.yin(y, fmin=50, fmax=400)
        pitch_clean = pitch[pitch > 0]  # Remove invalid pitches
        
        # Energy (loudness)
        rms = librosa.feature.rms(y=y)[0]
        energy_mean = np.mean(rms)
        energy_std = np.std(rms)
        
        # Pitch statistics
        pitch_mean = np.mean(pitch_clean) if len(pitch_clean) > 0 else 0
        pitch_std = np.std(pitch_clean) if len(pitch_clean) > 0 else 0
        pitch_range = np.max(pitch_clean) - np.min(pitch_clean) if len(pitch_clean) > 0 else 0
        
        # Tone score: Higher variation = more engaging (0-100)
        pitch_variation_score = min(100, max(0, (pitch_std / pitch_mean * 100) if pitch_mean > 0 else 0))
        energy_variation_score = min(100, max(0, (energy_std / energy_mean * 100) if energy_mean > 0 else 0))
        tone_score = (pitch_variation_score * 0.6 + energy_variation_score * 0.4)
        
        tone_assessment = self._assess_tone(pitch_variation_score, energy_variation_score)
        
        # 2. Speaking Pace/Rhythm
        # Tempo estimation
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        
        # Speaking rate (syllables per second approximation)
        # Use zero-crossing rate as proxy for speech rate
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        zcr_mean = np.mean(zcr)
        
        # Pace consistency (lower std = more consistent)
        zcr_std = np.std(zcr)
        pace_consistency_score = max(0, 100 - (zcr_std / zcr_mean * 100) if zcr_mean > 0 else 0)
        
        pace_assessment = self._assess_pace(tempo, zcr_mean, pace_consistency_score)
        
        # 3. Pronunciation/Clarity
        # Spectral centroid (brightness/clarity)
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        centroid_mean = np.mean(spectral_centroids)
        centroid_std = np.std(spectral_centroids)
        
        # Spectral rolloff (high frequency content)
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        rolloff_mean = np.mean(rolloff)
        
        # Clarity score (higher centroid and rolloff = clearer)
        clarity_score = min(100, max(0, (centroid_mean / 5000 * 50) + (rolloff_mean / 10000 * 50)))
        
        clarity_assessment = self._assess_clarity(clarity_score, centroid_mean, rolloff_mean)
        
        # 4. Emphasis and Intonation
        # Pitch contour analysis
        pitch_contour = librosa.yin(y, fmin=50, fmax=400)
        pitch_contour_clean = pitch_contour[pitch_contour > 0]
        
        # Calculate pitch changes (intonation)
        if len(pitch_contour_clean) > 1:
            pitch_changes = np.abs(np.diff(pitch_contour_clean))
            intonation_variation = np.mean(pitch_changes)
            intonation_score = min(100, max(0, (intonation_variation / 50) * 100))
        else:
            intonation_score = 0
        
        emphasis_assessment = self._assess_emphasis(intonation_score)
        
        # 5. Voice Quality (Volume and Clarity)
        # Volume (RMS energy)
        volume_score = min(100, max(0, (energy_mean / 0.1) * 100))  # Normalize to 0-100
        
        # Overall voice quality
        voice_quality_score = (clarity_score * 0.5 + volume_score * 0.3 + tone_score * 0.2)
        
        voice_quality_assessment = self._assess_voice_quality(volume_score, clarity_score, voice_quality_score)
        
        return {
            "tone_and_emotion": {
                "score": round(tone_score, 1),
                "pitch_mean": round(float(pitch_mean), 1),
                "pitch_variation": round(float(pitch_std), 1),
                "energy_variation": round(float(energy_std), 3),
                "assessment": tone_assessment,
                "strengths": self._get_tone_strengths(tone_score, pitch_variation_score),
                "improvements": self._get_tone_improvements(tone_score, pitch_variation_score)
            },
            "pace_and_rhythm": {
                "score": round(pace_consistency_score, 1),
                "tempo": round(float(tempo), 1),
                "consistency": round(pace_consistency_score, 1),
                "assessment": pace_assessment,
                "strengths": self._get_pace_strengths(pace_consistency_score),
                "improvements": self._get_pace_improvements(pace_consistency_score, tempo)
            },
            "pronunciation_and_clarity": {
                "score": round(clarity_score, 1),
                "spectral_centroid": round(float(centroid_mean), 1),
                "high_frequency_content": round(float(rolloff_mean), 1),
                "assessment": clarity_assessment,
                "strengths": self._get_clarity_strengths(clarity_score),
                "improvements": self._get_clarity_improvements(clarity_score)
            },
            "emphasis_and_intonation": {
                "score": round(intonation_score, 1),
                "pitch_variation": round(float(intonation_variation) if len(pitch_contour_clean) > 1 else 0, 1),
                "assessment": emphasis_assessment,
                "strengths": self._get_emphasis_strengths(intonation_score),
                "improvements": self._get_emphasis_improvements(intonation_score)
            },
            "voice_quality": {
                "score": round(voice_quality_score, 1),
                "volume_score": round(volume_score, 1),
                "clarity_score": round(clarity_score, 1),
                "assessment": voice_quality_assessment,
                "strengths": self._get_voice_quality_strengths(voice_quality_score),
                "improvements": self._get_voice_quality_improvements(voice_quality_score, volume_score, clarity_score)
            }
        }
    
    async def _get_transcription_with_timestamps(self, audio_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Get transcription with word-level timestamps using Whisper"""
        try:
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = filename
            
            # Use Whisper API with verbose_json to get timestamps
            transcript = self.openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                timestamp_granularities=["word"]
            )
            
            return {
                "text": transcript.text,
                "words": transcript.words if hasattr(transcript, 'words') else []
            }
        except Exception as e:
            # Fallback to simple transcription
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = filename
            transcript_text = self.openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
            return {"text": transcript_text, "words": []}
    
    def _analyze_pauses(self, transcript_data: Dict[str, Any], duration: float) -> Dict[str, Any]:
        """Analyze pauses from word timestamps"""
        words = transcript_data.get("words", [])
        
        if not words or len(words) < 2:
            return {
                "pauses": {
                    "score": 50.0,  # Default if can't analyze
                    "total_pauses": 0,
                    "average_pause_duration": 0,
                    "long_pauses": 0,
                    "assessment": "Unable to analyze pauses - insufficient data",
                    "strengths": [],
                    "improvements": ["Ensure clear speech with natural pauses"]
                }
            }
        
        pauses = []
        long_pauses = 0
        
        for i in range(len(words) - 1):
            current_end = words[i].end if hasattr(words[i], 'end') else getattr(words[i], 'end', 0)
            next_start = words[i + 1].start if hasattr(words[i + 1], 'start') else getattr(words[i + 1], 'start', 0)
            
            pause_duration = next_start - current_end
            if pause_duration > 0.1:  # Pauses longer than 100ms
                pauses.append(pause_duration)
                if pause_duration > 0.5:  # Long pause (>500ms)
                    long_pauses += 1
        
        if pauses:
            avg_pause = np.mean(pauses)
            pause_score = self._score_pauses(len(pauses), avg_pause, long_pauses, duration)
        else:
            avg_pause = 0
            pause_score = 30.0  # Low score if no pauses detected (might be too rushed)
        
        return {
            "pauses": {
                "score": round(pause_score, 1),
                "total_pauses": len(pauses),
                "average_pause_duration": round(float(avg_pause), 3) if pauses else 0,
                "long_pauses": long_pauses,
                "assessment": self._assess_pauses(len(pauses), avg_pause, long_pauses, duration),
                "strengths": self._get_pause_strengths(pause_score, len(pauses), long_pauses),
                "improvements": self._get_pause_improvements(pause_score, len(pauses), long_pauses, avg_pause)
            }
        }
    
    # Assessment helper methods
    def _assess_tone(self, pitch_var_score: float, energy_var_score: float) -> str:
        if pitch_var_score > 70 and energy_var_score > 60:
            return "Highly engaging and dynamic tone with excellent variation in pitch and energy. Demonstrates strong executive presence."
        elif pitch_var_score > 50 and energy_var_score > 40:
            return "Good tone variation with engaging delivery. Some room for more dynamic expression."
        elif pitch_var_score > 30:
            return "Moderate tone variation. Consider adding more emphasis and energy to key points."
        else:
            return "Tone is relatively monotone. Work on varying pitch and energy to create more engaging delivery."
    
    def _assess_pace(self, tempo: float, zcr_mean: float, consistency_score: float) -> str:
        if consistency_score > 80:
            return f"Excellent pacing consistency at {tempo:.1f} BPM. Speech rhythm is steady and professional."
        elif consistency_score > 60:
            return f"Good pacing with some variation. Tempo is {tempo:.1f} BPM. Aim for more consistent rhythm."
        else:
            return f"Pacing is inconsistent. Tempo varies around {tempo:.1f} BPM. Practice maintaining steady rhythm."
    
    def _assess_clarity(self, clarity_score: float, centroid: float, rolloff: float) -> str:
        if clarity_score > 80:
            return "Excellent pronunciation and clarity. Speech is crisp and easy to understand."
        elif clarity_score > 60:
            return "Good clarity overall. Some words could be articulated more clearly."
        elif clarity_score > 40:
            return "Moderate clarity. Focus on enunciating words more clearly and reducing mumbling."
        else:
            return "Clarity needs improvement. Work on clear articulation and pronunciation of words."
    
    def _assess_emphasis(self, intonation_score: float) -> str:
        if intonation_score > 70:
            return "Excellent use of emphasis and intonation. Key points are well-highlighted through pitch variation."
        elif intonation_score > 50:
            return "Good intonation with some emphasis. Consider adding more variation to highlight important points."
        else:
            return "Limited use of emphasis and intonation. Practice varying pitch to emphasize key messages."
    
    def _assess_voice_quality(self, volume_score: float, clarity_score: float, overall_score: float) -> str:
        if overall_score > 80:
            return "Excellent voice quality with good volume and clarity. Professional delivery."
        elif overall_score > 60:
            return "Good voice quality. Volume and clarity are adequate with room for improvement."
        else:
            return "Voice quality needs improvement. Focus on speaking louder and more clearly."
    
    def _assess_pauses(self, pause_count: int, avg_pause: float, long_pauses: int, duration: float) -> str:
        pause_rate = pause_count / duration if duration > 0 else 0
        
        if 0.3 <= pause_rate <= 0.8 and avg_pause < 0.4 and long_pauses < pause_count * 0.2:
            return f"Natural pause pattern with {pause_count} pauses. Average pause duration is {avg_pause:.2f}s."
        elif pause_rate < 0.3:
            return f"Too few pauses ({pause_count}). Speech may sound rushed. Add more natural pauses."
        elif pause_rate > 0.8 or long_pauses > pause_count * 0.3:
            return f"Too many or too long pauses ({pause_count} total, {long_pauses} long). Work on smoother flow."
        else:
            return f"Pause pattern is acceptable but could be more natural. {pause_count} pauses detected."
    
    def _score_pauses(self, pause_count: int, avg_pause: float, long_pauses: int, duration: float) -> float:
        pause_rate = pause_count / duration if duration > 0 else 0
        
        # Ideal: 0.3-0.8 pauses per second, avg pause 0.2-0.4s, <20% long pauses
        if 0.3 <= pause_rate <= 0.8:
            rate_score = 100
        elif pause_rate < 0.3:
            rate_score = 50 - (0.3 - pause_rate) * 100
        else:
            rate_score = 100 - (pause_rate - 0.8) * 50
        
        if 0.2 <= avg_pause <= 0.4:
            duration_score = 100
        elif avg_pause < 0.2:
            duration_score = avg_pause / 0.2 * 100
        else:
            duration_score = max(0, 100 - (avg_pause - 0.4) * 100)
        
        long_pause_ratio = long_pauses / pause_count if pause_count > 0 else 0
        if long_pause_ratio < 0.2:
            long_score = 100
        else:
            long_score = max(0, 100 - (long_pause_ratio - 0.2) * 200)
        
        return (rate_score * 0.4 + duration_score * 0.4 + long_score * 0.2)
    
    # Strengths and improvements helpers
    def _get_tone_strengths(self, score: float, pitch_var: float) -> list:
        strengths = []
        if score > 70:
            strengths.append("Excellent tone variation and energy")
        if pitch_var > 60:
            strengths.append("Good pitch variation for engaging delivery")
        if score > 50:
            strengths.append("Adequate tone for professional communication")
        return strengths if strengths else ["Tone is present"]
    
    def _get_tone_improvements(self, score: float, pitch_var: float) -> list:
        improvements = []
        if score < 50:
            improvements.append("Vary your pitch more to avoid monotone delivery")
        if pitch_var < 40:
            improvements.append("Add more energy and emphasis to key points")
        if score < 70:
            improvements.append("Practice using vocal variety to engage listeners")
        return improvements if improvements else ["Continue working on tone variation"]
    
    def _get_pace_strengths(self, score: float) -> list:
        if score > 80:
            return ["Excellent pacing consistency", "Steady rhythm throughout"]
        elif score > 60:
            return ["Good pacing overall"]
        return []
    
    def _get_pace_improvements(self, score: float, tempo: float) -> list:
        improvements = []
        if score < 60:
            improvements.append("Work on maintaining consistent speaking pace")
        if tempo < 60 or tempo > 180:
            improvements.append("Adjust speaking speed to optimal range (120-160 WPM equivalent)")
        if score < 80:
            improvements.append("Practice maintaining steady rhythm without rushing or dragging")
        return improvements if improvements else ["Continue practicing consistent pacing"]
    
    def _get_clarity_strengths(self, score: float) -> list:
        if score > 80:
            return ["Excellent pronunciation", "Clear articulation"]
        elif score > 60:
            return ["Good clarity overall"]
        return []
    
    def _get_clarity_improvements(self, score: float) -> list:
        improvements = []
        if score < 60:
            improvements.append("Enunciate words more clearly")
            improvements.append("Reduce mumbling or unclear speech")
        if score < 80:
            improvements.append("Focus on crisp pronunciation of each word")
        return improvements if improvements else ["Continue working on clarity"]
    
    def _get_emphasis_strengths(self, score: float) -> list:
        if score > 70:
            return ["Excellent use of emphasis", "Good intonation variation"]
        elif score > 50:
            return ["Adequate emphasis on key points"]
        return []
    
    def _get_emphasis_improvements(self, score: float) -> list:
        improvements = []
        if score < 50:
            improvements.append("Use pitch variation to emphasize important points")
            improvements.append("Practice varying intonation for key messages")
        if score < 70:
            improvements.append("Add more emphasis to highlight critical information")
        return improvements if improvements else ["Continue working on emphasis"]
    
    def _get_voice_quality_strengths(self, score: float) -> list:
        if score > 80:
            return ["Excellent voice quality", "Professional delivery"]
        elif score > 60:
            return ["Good voice quality"]
        return []
    
    def _get_voice_quality_improvements(self, score: float, volume: float, clarity: float) -> list:
        improvements = []
        if volume < 60:
            improvements.append("Speak louder and with more projection")
        if clarity < 60:
            improvements.append("Improve clarity and articulation")
        if score < 60:
            improvements.append("Overall voice quality needs improvement")
        return improvements if improvements else ["Continue working on voice quality"]
    
    def _get_pause_strengths(self, score: float, count: int, long_pauses: int) -> list:
        strengths = []
        if score > 70:
            strengths.append("Natural pause pattern")
        if count > 0 and long_pauses < count * 0.2:
            strengths.append("Appropriate pause duration")
        return strengths if strengths else ["Some pauses detected"]
    
    def _get_pause_improvements(self, score: float, count: int, long_pauses: int, avg_pause: float) -> list:
        improvements = []
        if count == 0:
            improvements.append("Add natural pauses between thoughts")
        elif count < 3:
            improvements.append("Include more pauses for better comprehension")
        if long_pauses > count * 0.3:
            improvements.append("Reduce length of pauses for smoother flow")
        if avg_pause > 0.5:
            improvements.append("Shorten pause duration for better pacing")
        if score < 50:
            improvements.append("Work on natural pause rhythm")
        return improvements if improvements else ["Continue practicing natural pauses"]
