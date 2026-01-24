/*
  # Create Question Answers Table

  1. New Table
    - `question_answers`
      - `id` (uuid, primary key)
      - `question_id` (integer, references interview_questions.id)
      - `question_index` (integer) - index of question within the questions string
      - `answer` (text) - AI-generated ideal answer
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - UNIQUE constraint on (question_id, question_index)
  
  2. Security
    - Enable RLS on the table
    - All authenticated users can read answers
    - Only backend (service role) can insert/update answers
*/

-- Create question_answers table
CREATE TABLE IF NOT EXISTS public.question_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id integer NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  question_index integer NOT NULL,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(question_id, question_index)
);

ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read answers
CREATE POLICY "Authenticated users can read answers"
  ON public.question_answers
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to insert/update answers (for backend API)
CREATE POLICY "Service role can manage answers"
  ON public.question_answers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS question_answers_question_id_idx ON public.question_answers(question_id);
CREATE INDEX IF NOT EXISTS question_answers_question_index_idx ON public.question_answers(question_index);
CREATE INDEX IF NOT EXISTS question_answers_question_id_index_idx ON public.question_answers(question_id, question_index);
