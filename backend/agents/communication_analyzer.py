import os
from openai import OpenAI
from typing import Dict, Any
import json

class CommunicationAnalyzer:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        self.openai_client = OpenAI(api_key=api_key)
        self.model = "gpt-4o-mini"
    
    async def compress_answer(
        self, 
        question: str, 
        answer: str
    ) -> Dict[str, Any]:
        """
        Compress an answer to 2 minutes and 60 seconds, analyzing what was removed and improved.
        """
        prompt = f"""You are an expert communication coach for Product Managers. Analyze this interview answer and create compressed versions.

Question: {question}

Original Answer:
{answer}

Your task:
1. Create a 2-minute version (approximately 250-300 words when spoken)
2. Create a 60-second version (approximately 150-180 words when spoken)
3. Identify specific fluff that was removed
4. Highlight structure improvements
5. Analyze decision framing improvements

Return ONLY valid JSON with this structure:
{{
  "original": "the original answer text",
  "compressed_2min": "2-minute compressed version",
  "compressed_60sec": "60-second compressed version",
  "removed_fluff": ["specific phrase or sentence removed", "another example"],
  "structure_improvements": ["improvement 1", "improvement 2"],
  "decision_framing": "analysis of how decision framing improved"
}}

Be specific and actionable. Focus on PM interview expectations."""

        try:
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert communication coach. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
        except Exception as e:
            raise Exception(f"Error compressing answer: {str(e)}")
    
    async def analyze_presence(
        self,
        prompt: str,
        transcript: str,
        audio_duration: float = 0
    ) -> Dict[str, Any]:
        """
        Analyze speech patterns for executive presence: fillers, qualifiers, speed, confidence.
        """
        # Calculate words per minute if duration is provided
        word_count = len(transcript.split())
        words_per_minute = (word_count / audio_duration * 60) if audio_duration > 0 else 0
        
        analysis_prompt = f"""You are a blunt executive communication coach. Analyze this speech transcript for executive presence issues.

Prompt given: {prompt}

Transcript:
{transcript}

Words per minute: {words_per_minute:.1f} (if duration unknown, estimate based on typical speaking pace)

Analyze for:
1. Fillers (uh, um, like, you know) - count them, give examples, explain impact
2. Speaking speed - assess if too fast/slow, recommend pace
3. Weak qualifiers ("I think", "maybe", "perhaps", "kind of", "sort of", "I guess") - find them, explain impact, provide assertive replacements
4. Confidence indicators - uncertain sentence endings (voice trailing off, questions instead of statements), examples, how to fix

Be BRUTALLY HONEST and SPECIFIC. No generic feedback. Map everything to PM interview expectations.

Return ONLY valid JSON with this structure:
{{
  "fillers": {{
    "count": number,
    "examples": ["example 1", "example 2"],
    "impact": "specific impact on executive presence"
  }},
  "speaking_speed": {{
    "words_per_minute": {words_per_minute:.1f},
    "assessment": "assessment of speed",
    "recommendation": "specific recommendation"
  }},
  "qualifiers": {{
    "weak_phrases": ["phrase 1", "phrase 2"],
    "impact": "how this weakens presence",
    "replacements": [
      {{"before": "weak phrase", "after": "assertive replacement"}}
    ]
  }},
  "confidence_indicators": {{
    "uncertain_endings": number,
    "examples": ["example 1", "example 2"],
    "improvements": ["how to fix 1", "how to fix 2"]
  }},
  "overall_assessment": "blunt overall assessment",
  "key_improvements": ["improvement 1", "improvement 2", "improvement 3"]
}}

Focus on actionable, specific feedback. No fluff."""

        try:
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a blunt executive communication coach. Always respond with valid JSON only."},
                    {"role": "user", "content": analysis_prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            # Override words_per_minute with calculated value if we have it
            if words_per_minute > 0:
                result["speaking_speed"]["words_per_minute"] = round(words_per_minute, 1)
            return result
        except Exception as e:
            raise Exception(f"Error analyzing presence: {str(e)}")
