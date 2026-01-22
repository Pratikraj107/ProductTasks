/*
  # Create Subtopics Table

  1. New Tables
    - `subtopics`
      - `id` (uuid, primary key)
      - `topic_id` (uuid, foreign key to topics)
      - `title` (text, not null)
      - `description` (text)
      - `duration` (text) - estimated completion time
      - `lesson_count` (integer) - number of lessons
      - `order_index` (integer) - for ordering subtopics
      - `is_locked` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `subtopics` table
    - Add policy for authenticated users to read subtopics
*/

CREATE TABLE IF NOT EXISTS public.subtopics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  duration text,
  lesson_count integer DEFAULT 0,
  order_index integer,
  is_locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read subtopics"
  ON public.subtopics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS subtopics_topic_id_idx ON public.subtopics(topic_id);
CREATE INDEX IF NOT EXISTS subtopics_order_index_idx ON public.subtopics(order_index);
