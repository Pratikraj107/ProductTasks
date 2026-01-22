/*
  # Create Lessons Table

  1. New Tables
    - `lessons`
      - `id` (uuid, primary key)
      - `subtopic_id` (uuid, foreign key to subtopics)
      - `title` (text, not null)
      - `content` (jsonb) - structured lesson content with sections
      - `key_takeaways` (text[]) - array of key takeaways
      - `order_index` (integer) - for ordering lessons
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `lessons` table
    - Add policy for authenticated users to read lessons
*/

CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id uuid NOT NULL REFERENCES public.subtopics(id) ON DELETE CASCADE,
  title text NOT NULL,
  content jsonb,
  key_takeaways text[],
  order_index integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lessons"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS lessons_subtopic_id_idx ON public.lessons(subtopic_id);
CREATE INDEX IF NOT EXISTS lessons_order_index_idx ON public.lessons(order_index);
