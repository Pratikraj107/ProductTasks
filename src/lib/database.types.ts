export interface Topic {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  gradient: string | null;
  order_index: number | null;
  created_at: string;
  updated_at: string;
}

export interface Subtopic {
  id: string;
  topic_id: string;
  title: string;
  description: string | null;
  duration: string | null;
  lesson_count: number;
  order_index: number | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  subtopic_id: string;
  title: string;
  content: {
    heading: string;
    content: string[];
  }[] | null;
  key_takeaways: string[] | null;
  order_index: number | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  subtopic_id: string | null;
  title: string;
  description: string | null;
  duration: string | null;
  order_index: number | null;
  category: string | null;
}

export interface Content {
  id: string;
  subtopic_id: string | null;
  content_text: string;
  content_heading: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Resource {
  id: string;
  subtopic_id: string | null;
  title: string;
  description: string | null;
  url: string | null;
  type: 'article' | 'video' | 'pdf' | 'word' | 'other' | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserProgress {
  id: string;
  user_id: string;
  subtopic_id: string | null;
  task_id: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TasksCompletion {
  id: string;
  user_id: string | null;
  completed_at: string | null;
  tasks_id: string | null;
  completed: boolean | null;
  inProgress?: boolean | null;
  ToDo?: boolean | null;
}

export interface InterviewQuestion {
  id: number;
  created_at: string;
  topic: string | null;
  questions: string | null;
  answer: string[] | null;
}
