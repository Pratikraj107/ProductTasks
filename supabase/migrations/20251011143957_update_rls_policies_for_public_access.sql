/*
  # Update RLS Policies for Public Content Access

  1. Changes
    - Allow public (anon) users to read topics, subtopics, lessons, and tasks
    - Keep user_progress restricted to authenticated users only
  
  2. Security
    - Content is readable by anyone
    - User progress remains private and user-specific
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read topics" ON public.topics;
DROP POLICY IF EXISTS "Authenticated users can read subtopics" ON public.subtopics;
DROP POLICY IF EXISTS "Authenticated users can read lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authenticated users can read tasks" ON public.tasks;

-- Create new policies allowing anon access to content
CREATE POLICY "Anyone can read topics"
  ON public.topics
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read subtopics"
  ON public.subtopics
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read lessons"
  ON public.lessons
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read tasks"
  ON public.tasks
  FOR SELECT
  USING (true);
