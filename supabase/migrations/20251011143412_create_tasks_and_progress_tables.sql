/*
  # Create Tasks and User Progress Tables

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `subtopic_id` (uuid, foreign key to subtopics)
      - `title` (text, not null)
      - `description` (text)
      - `instructions` (text[]) - array of instruction steps
      - `estimated_time` (text) - e.g., "30 min"
      - `difficulty` (text) - easy, medium, hard
      - `order_index` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `subtopic_id` (uuid, references subtopics)
      - `task_id` (uuid, references tasks, nullable)
      - `is_completed` (boolean, default false)
      - `completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Users can read all tasks
    - Users can only read/write their own progress
*/

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id uuid NOT NULL REFERENCES public.subtopics(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  instructions text[],
  estimated_time text,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  order_index integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS tasks_subtopic_id_idx ON public.tasks(subtopic_id);
CREATE INDEX IF NOT EXISTS tasks_order_index_idx ON public.tasks(order_index);

CREATE TABLE IF NOT EXISTS public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subtopic_id uuid REFERENCES public.subtopics(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subtopic_id, task_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON public.user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_progress_user_id_idx ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS user_progress_subtopic_id_idx ON public.user_progress(subtopic_id);
CREATE INDEX IF NOT EXISTS user_progress_task_id_idx ON public.user_progress(task_id);
