/*
  # Create Topics Table

  1. New Tables
    - `topics`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text)
      - `icon` (text) - icon identifier (e.g., 'compass', 'target')
      - `gradient` (text) - gradient color scheme (e.g., 'from-blue-500 to-cyan-500')
      - `order_index` (integer) - for ordering topics
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `topics` table
    - Add policy for authenticated users to read topics
*/

CREATE TABLE IF NOT EXISTS public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text,
  gradient text,
  order_index integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read topics"
  ON public.topics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS topics_order_index_idx ON public.topics(order_index);
