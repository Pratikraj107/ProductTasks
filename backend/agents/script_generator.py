import os
from openai import OpenAI
from typing import Dict, Any, Literal
import json
import asyncio

class ScriptGenerator:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        self.openai_client = OpenAI(api_key=api_key)
        self.model = "gpt-4o-mini"
    
    async def generate_script(
        self,
        script_type: Literal['interview_question', 'presentation_prompt', 'star_scenario', 'elevator_pitch']
    ) -> Dict[str, Any]:
        """
        Generate a practice script based on the type.
        Returns a structured script with content, tips, key points, timing, and sections.
        """
        
        type_prompts = {
            'interview_question': """Generate a Product Management interview question that requires a detailed answer. 
            The question should be realistic and commonly asked in PM interviews. 
            Include context that makes it challenging and relevant.""",
            
            'presentation_prompt': """Generate a presentation prompt for a Product Manager. 
            This should be a scenario where they need to present to stakeholders, executives, or a team. 
            Include the audience, context, and what they need to communicate.""",
            
            'star_scenario': """Generate a STAR (Situation, Task, Action, Result) story scenario for a Product Manager. 
            Create a realistic situation that a PM might have faced, requiring them to tell a structured story 
            about how they handled it.""",
            
            'elevator_pitch': """Generate an elevator pitch scenario for a Product Manager. 
            This should be a situation where they need to quickly and effectively communicate 
            a product idea, feature, or strategy to someone important in a short time frame."""
        }
        
        base_prompt = type_prompts.get(script_type, type_prompts['interview_question'])
        
        prompt = f"""{base_prompt}

Create a comprehensive practice script with the following structure:

1. **Title**: A clear, descriptive title
2. **Script Content**: The main content (question, prompt, or scenario) - should be detailed and realistic
3. **Sections**: Break down the content into logical sections with headings and guidance
4. **Key Points**: List 3-5 key points the user should cover when practicing
5. **Tips**: Provide 3-5 actionable tips for delivering this effectively
6. **Estimated Time**: Suggest how long the practice should take (e.g., "2-3 minutes", "5 minutes")

For STAR scenarios, structure should include: Situation, Task, Action, Result sections.
For presentations, include: Opening, Main Points, Closing sections.
For elevator pitches, include: Hook, Problem, Solution, Call to Action sections.

Return ONLY valid JSON with this structure:
{{
  "title": "descriptive title",
  "script_content": "the main script/question/prompt text",
  "sections": [
    {{
      "heading": "Section heading",
      "content": "Section content/guidance",
      "subsections": ["point 1", "point 2"]
    }}
  ],
  "key_points": ["key point 1", "key point 2", "key point 3"],
  "tips": ["tip 1", "tip 2", "tip 3"],
  "estimated_time": "2-3 minutes"
}}

Make it realistic, challenging, and valuable for PM interview preparation."""

        try:
            print(f"[DEBUG] Calling OpenAI API for script generation (type: {script_type})")
            
            # Run the synchronous OpenAI call in a thread pool with timeout
            loop = asyncio.get_event_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: self.openai_client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {"role": "system", "content": "You are an expert Product Management coach. Always respond with valid JSON only."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.8,
                        response_format={"type": "json_object"}
                    )
                ),
                timeout=60.0  # 60 second timeout
            )
            
            print(f"[DEBUG] OpenAI API call completed, parsing response")
            result = json.loads(response.choices[0].message.content)
            result['script_type'] = script_type
            print(f"[DEBUG] Script generation successful")
            return result
        except asyncio.TimeoutError:
            print(f"[ERROR] OpenAI API call timed out after 60 seconds")
            raise Exception("Script generation timed out after 60 seconds. Please try again.")
        except json.JSONDecodeError as e:
            print(f"[ERROR] Invalid JSON response from AI: {str(e)}")
            raise Exception(f"Invalid JSON response from AI: {str(e)}")
        except Exception as e:
            print(f"[ERROR] Error generating script: {str(e)}")
            raise Exception(f"Error generating script: {str(e)}")
    
    async def generate_complete_answer(
        self,
        script_content: str,
        script_type: str,
        sections: list = None,
        key_points: list = None,
        tips: list = None
    ) -> str:
        """
        Generate a complete answer/script based on the structure and guidance from the generated script.
        User will read this complete answer while recording.
        """
        
        type_instructions = {
            'interview_question': """Generate a complete, well-structured answer to this interview question. 
            The answer should be comprehensive and follow best PM practices.""",
            
            'presentation_prompt': """Generate a complete presentation script based on this prompt. 
            Follow the structure provided (Opening, Main Points, Closing) and create a full script that can be read aloud.""",
            
            'star_scenario': """Generate a complete STAR story based on this scenario. 
            Create a full narrative following the Situation, Task, Action, Result structure.""",
            
            'elevator_pitch': """Generate a complete elevator pitch script based on this prompt. 
            Create a full pitch that can be read aloud, following the structure provided."""
        }
        
        base_instruction = type_instructions.get(script_type, type_instructions['interview_question'])
        
        sections_text = ""
        if sections:
            sections_text = "\n\nStructure to follow:\n"
            for section in sections:
                sections_text += f"- {section.get('heading', '')}: {section.get('content', '')}\n"
                if section.get('subsections'):
                    for sub in section.get('subsections', []):
                        sections_text += f"  • {sub}\n"
        
        key_points_text = ""
        if key_points:
            key_points_text = "\n\nKey points to cover:\n" + "\n".join([f"- {point}" for point in key_points])
        
        tips_text = ""
        if tips:
            tips_text = "\n\nTips to incorporate:\n" + "\n".join([f"- {tip}" for tip in tips])
        
        prompt = f"""{base_instruction}

Original Script/Prompt:
{script_content}
{sections_text}
{key_points_text}
{tips_text}

Generate a complete, ready-to-read answer/script that:
1. Follows the structure and sections provided
2. Covers all key points
3. Incorporates the tips naturally
4. Is written in a conversational, natural speaking style
5. Can be read aloud smoothly
6. Is comprehensive and well-developed

Return ONLY the complete answer/script text. No explanations, no JSON, just the text that the user will read."""

        try:
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert Product Management coach. Generate complete, ready-to-read scripts and answers."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise Exception(f"Error generating complete answer: {str(e)}")
