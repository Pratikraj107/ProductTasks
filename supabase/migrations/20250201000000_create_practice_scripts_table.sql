/*
  # Create Practice Scripts Table

  1. New Table
    - `practice_scripts`
      - `id` (uuid, primary key)
      - `script_type` (text) - 'interview_question', 'presentation_prompt', 'star_scenario', 'elevator_pitch'
      - `title` (text, not null)
      - `script_content` (text, not null) - the main script text
      - `tips` (text[]) - array of tips
      - `key_points` (text[]) - array of key points to cover
      - `estimated_time` (text) - e.g., "2 minutes", "5 minutes"
      - `sections` (jsonb) - structured sections with headings and content
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `practice_scripts` table
    - Add policy for authenticated users to read scripts
*/

CREATE TABLE IF NOT EXISTS public.practice_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_type text NOT NULL CHECK (script_type IN ('interview_question', 'presentation_prompt', 'star_scenario', 'elevator_pitch')),
  title text NOT NULL,
  script_content text NOT NULL,
  tips text[],
  key_points text[],
  estimated_time text,
  sections jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.practice_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read practice scripts"
  ON public.practice_scripts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS practice_scripts_script_type_idx ON public.practice_scripts(script_type);
CREATE INDEX IF NOT EXISTS practice_scripts_created_at_idx ON public.practice_scripts(created_at);
