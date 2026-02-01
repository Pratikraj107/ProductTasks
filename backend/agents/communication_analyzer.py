import os
from openai import OpenAI
from typing import Dict, Any
import json
import re

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
        audio_duration: float = 0,
        is_reading_script: bool = False
    ) -> Dict[str, Any]:
        """
        Analyze speech patterns for executive presence: fillers, qualifiers, speed, confidence.
        """
        # Validate transcript
        if not transcript or not transcript.strip():
            raise ValueError("Transcript is empty or invalid. Cannot analyze speech.")
        
        # Calculate words per minute
        word_count = len(transcript.split())
        
        if audio_duration > 0:
            # Calculate actual WPM from duration
            words_per_minute = (word_count / audio_duration) * 60
        else:
            # Estimate WPM based on typical speaking pace (average 150 WPM for normal speech)
            # Use a conservative estimate if duration is unknown
            estimated_duration = word_count / 150  # Estimate duration at 150 WPM
            words_per_minute = 150  # Default estimate
            audio_duration = estimated_duration
        
        # Count fillers in transcript (case-insensitive)
        filler_words = ['uh', 'um', 'like', 'you know', 'er', 'ah', 'well', 'so', 'actually']
        filler_count = 0
        filler_examples = []
        transcript_lower = transcript.lower()
        words = transcript.split()
        
        for filler in filler_words:
            count = transcript_lower.count(f' {filler} ') + transcript_lower.count(f' {filler}.') + transcript_lower.count(f' {filler},')
            if count > 0:
                filler_count += count
                # Find context around fillers
                pattern = re.compile(rf'\b{re.escape(filler)}\b', re.IGNORECASE)
                matches = list(pattern.finditer(transcript))
                for match in matches[:3]:  # Get up to 3 examples
                    start = max(0, match.start() - 30)
                    end = min(len(transcript), match.end() + 30)
                    context = transcript[start:end].strip()
                    if context not in filler_examples:
                        filler_examples.append(context)
        
        if is_reading_script:
            # MODE 1: Reading AI-generated script - Evaluate ONLY speech delivery
            analysis_prompt = f"""You are an expert executive communication coach specializing in Product Management interviews. 

**IMPORTANT: The user is reading an AI-generated script. DO NOT evaluate content quality, structure, accuracy, or completeness. ONLY evaluate SPEECH DELIVERY.**

**Context:**
- Original Prompt/Question: {prompt}
- Transcript word count: {word_count} words
- Recording duration: {audio_duration:.1f} seconds
- Calculated speaking speed: {words_per_minute:.1f} words per minute
- **Mode: Reading Script (Delivery Only)**

**Transcript to analyze:**
"{transcript}"

**Your Analysis Tasks (SPEECH DELIVERY ONLY):**

1. **Fillers Analysis:**
   - I've detected approximately {filler_count} filler words (uh, um, like, you know, etc.)
   - Review the transcript and provide EXACT count and SPECIFIC examples with context
   - Explain the impact on executive presence for a PM role

2. **Speaking Speed Analysis:**
   - Current speed: {words_per_minute:.1f} WPM
   - Ideal range for PM interviews: 120-160 WPM
   - Assess if too fast (hard to follow), too slow (loses attention), or optimal
   - Provide SPECIFIC recommendation based on the actual speed

3. **Weak Qualifiers Detection:**
   - Search for: "I think", "maybe", "perhaps", "kind of", "sort of", "I guess", "probably", "might", "could", "just", "a bit", "somewhat"
   - List EXACT phrases found in the transcript (even when reading, these can slip in)
   - Explain how each weakens authority and confidence
   - Provide assertive replacements for EACH phrase found

4. **Confidence Indicators:**
   - Look for: sentence endings that trail off, questions instead of statements, hedging language
   - Count uncertain endings and provide SPECIFIC examples from the transcript
   - Give concrete improvements for each issue found

5. **Tone and Emphasis:**
   - Analyze the overall tone: Is it confident, engaging, authoritative, or flat/monotone?
   - Assess emphasis: Are key points emphasized appropriately? Is there variation in tone?
   - Provide specific feedback on how to improve tone and emphasis for executive presence

6. **Pauses and Pacing:**
   - Analyze natural pauses: Are there appropriate pauses for emphasis? Too many/too few?
   - Assess pacing: Is the rhythm natural? Are there awkward pauses or rushed sections?
   - Provide specific recommendations for improving pacing

7. **Pronunciation and Clarity:**
   - Assess pronunciation: Are words clearly articulated? Any mumbling or unclear words?
   - Evaluate clarity: Is the speech easy to understand? Any issues with enunciation?
   - Provide specific feedback on pronunciation and clarity improvements

8. **Overall Delivery Assessment:**
   - Provide a comprehensive assessment of SPEECH DELIVERY ONLY
   - Be specific about delivery strengths and weaknesses
   - Connect feedback to PM interview expectations
   - DO NOT comment on content quality, structure, or accuracy (that's AI-generated)

**CRITICAL REQUIREMENTS:**
- Focus ONLY on speech delivery - tone, pace, clarity, fillers, confidence, pronunciation, pauses, emphasis
- DO NOT evaluate content quality, structure, accuracy, completeness, or relevance
- Be SPECIFIC - reference actual delivery patterns from the transcript
- Be ACCURATE - base all counts and assessments on the actual transcript content
- Be ACTIONABLE - provide concrete improvements, not generic advice

Return ONLY valid JSON with this EXACT structure:
{{
  "fillers": {{
    "count": <exact number from transcript>,
    "examples": ["specific example with context from transcript", "another example"],
    "impact": "specific explanation of how fillers affect executive presence for PM role"
  }},
  "speaking_speed": {{
    "words_per_minute": {words_per_minute:.1f},
    "assessment": "specific assessment based on {words_per_minute:.1f} WPM - is it too fast, too slow, or optimal?",
    "recommendation": "specific recommendation based on actual speed measurement"
  }},
  "qualifiers": {{
    "weak_phrases": ["exact phrase 1 from transcript", "exact phrase 2 from transcript"],
    "impact": "specific explanation of how these qualifiers weaken presence",
    "replacements": [
      {{"before": "exact weak phrase from transcript", "after": "assertive replacement"}},
      {{"before": "another exact phrase", "after": "another replacement"}}
    ]
  }},
  "confidence_indicators": {{
    "uncertain_endings": <exact count>,
    "examples": ["specific example sentence from transcript", "another example"],
    "improvements": ["specific improvement for example 1", "specific improvement for example 2"]
  }},
  "tone_and_emphasis": {{
    "assessment": "specific assessment of tone and emphasis",
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"]
  }},
  "pauses_and_pacing": {{
    "assessment": "specific assessment of pauses and pacing",
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"]
  }},
  "pronunciation_and_clarity": {{
    "assessment": "specific assessment of pronunciation and clarity",
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"]
  }},
  "overall_assessment": "comprehensive assessment of SPEECH DELIVERY ONLY (not content)",
  "key_improvements": ["specific delivery improvement 1", "specific delivery improvement 2", "specific delivery improvement 3"]
}}

Remember: You are evaluating SPEECH DELIVERY ONLY. The content is AI-generated, so do not evaluate content quality."""
        else:
            # MODE 2: Giving own answer - Evaluate BOTH content AND delivery
            analysis_prompt = f"""You are an expert executive communication coach specializing in Product Management interviews. Analyze this speech transcript with precision and provide specific, actionable feedback on BOTH content and delivery.

**Context:**
- Prompt/Question: {prompt}
- Transcript word count: {word_count} words
- Recording duration: {audio_duration:.1f} seconds
- Calculated speaking speed: {words_per_minute:.1f} words per minute
- **Mode: Own Answer (Content + Delivery)**

**Transcript to analyze:**
"{transcript}"

**Your Analysis Tasks (CONTENT + DELIVERY):**

1. **Fillers Analysis:**
   - I've detected approximately {filler_count} filler words (uh, um, like, you know, etc.)
   - Review the transcript and provide EXACT count and SPECIFIC examples with context
   - Explain the impact on executive presence for a PM role

2. **Speaking Speed Analysis:**
   - Current speed: {words_per_minute:.1f} WPM
   - Ideal range for PM interviews: 120-160 WPM
   - Assess if too fast (hard to follow), too slow (loses attention), or optimal
   - Provide SPECIFIC recommendation based on the actual speed

3. **Weak Qualifiers Detection:**
   - Search for: "I think", "maybe", "perhaps", "kind of", "sort of", "I guess", "probably", "might", "could", "just", "a bit", "somewhat"
   - List EXACT phrases found in the transcript
   - Explain how each weakens authority and confidence
   - Provide assertive replacements for EACH phrase found

4. **Confidence Indicators:**
   - Look for: sentence endings that trail off, questions instead of statements, hedging language
   - Count uncertain endings and provide SPECIFIC examples from the transcript
   - Give concrete improvements for each issue found

5. **Content Quality (Structure, Completeness, Relevance):**
   - Evaluate the structure: Is it well-organized? Does it follow a logical flow?
   - Assess completeness: Does it fully address the prompt/question?
   - Check relevance: Is the content relevant to PM interview expectations?
   - Provide specific feedback on content improvements

6. **Overall Assessment:**
   - Provide a comprehensive, honest assessment of BOTH content quality AND executive presence
   - Be specific about strengths and weaknesses in both areas
   - Connect feedback to PM interview expectations

**CRITICAL REQUIREMENTS:**
- Evaluate BOTH content quality/structure AND speech delivery
- Be SPECIFIC - reference actual words/phrases from the transcript
- Be ACCURATE - base all counts and assessments on the actual transcript content
- Be ACTIONABLE - provide concrete improvements, not generic advice
- If transcript is too short or unclear, note this but still provide best analysis possible
- DO NOT make up data - if something isn't in the transcript, don't claim it is

Return ONLY valid JSON with this EXACT structure:
{{
  "fillers": {{
    "count": <exact number from transcript>,
    "examples": ["specific example with context from transcript", "another example"],
    "impact": "specific explanation of how fillers affect executive presence for PM role"
  }},
  "speaking_speed": {{
    "words_per_minute": {words_per_minute:.1f},
    "assessment": "specific assessment based on {words_per_minute:.1f} WPM - is it too fast, too slow, or optimal?",
    "recommendation": "specific recommendation based on actual speed measurement"
  }},
  "qualifiers": {{
    "weak_phrases": ["exact phrase 1 from transcript", "exact phrase 2 from transcript"],
    "impact": "specific explanation of how these qualifiers weaken presence",
    "replacements": [
      {{"before": "exact weak phrase from transcript", "after": "assertive replacement"}},
      {{"before": "another exact phrase", "after": "another replacement"}}
    ]
  }},
  "confidence_indicators": {{
    "uncertain_endings": <exact count>,
    "examples": ["specific example sentence from transcript", "another example"],
    "improvements": ["specific improvement for example 1", "specific improvement for example 2"]
  }},
  "content_quality": {{
    "structure": "assessment of content structure and organization",
    "completeness": "assessment of how completely the prompt was addressed",
    "relevance": "assessment of relevance to PM interview expectations",
    "improvements": ["content improvement 1", "content improvement 2"]
  }},
  "overall_assessment": "comprehensive assessment of BOTH content quality AND speech delivery",
  "key_improvements": ["specific improvement 1 (content or delivery)", "specific improvement 2", "specific improvement 3"]
}}

Remember: Base everything on the ACTUAL transcript provided. Be precise and specific."""

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
            
            # Ensure words_per_minute is set correctly
            result["speaking_speed"]["words_per_minute"] = round(words_per_minute, 1)
            
            # Validate and ensure all required fields exist
            if "fillers" not in result:
                result["fillers"] = {"count": filler_count, "examples": filler_examples[:3], "impact": "Analysis incomplete"}
            elif filler_count > 0 and len(result["fillers"].get("examples", [])) == 0:
                # If AI didn't provide examples but we found fillers, use our examples
                result["fillers"]["examples"] = filler_examples[:3]
            
            # Ensure fillers count matches our calculation if AI count seems off
            if result["fillers"].get("count", 0) == 0 and filler_count > 0:
                result["fillers"]["count"] = filler_count
            
            return result
        except Exception as e:
            raise Exception(f"Error analyzing presence: {str(e)}")
