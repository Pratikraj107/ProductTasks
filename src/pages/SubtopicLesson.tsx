import { ArrowLeft, BookOpen, CheckSquare, Clock, ChevronRight, ExternalLink, FileText, Video, Link2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import TaskModal from '../components/TaskModal';
import SEOHead from '../components/SEOHead';
import type { Subtopic, Content, Task, TasksCompletion, Resource } from '../lib/database.types';

interface SubtopicLessonProps {
  topicId: string;
  subtopicId: string;
  onBack: () => void;
}

export default function SubtopicLesson({ subtopicId, onBack }: SubtopicLessonProps) {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtopic, setSubtopic] = useState<Subtopic | null>(null);
  const [content, setContent] = useState<Content[]>([]);
  const [completions, setCompletions] = useState<TasksCompletion[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const seo = (
    <SEOHead
      title={`Product Management Lesson — ${subtopic?.title || 'Lesson'} | ProductTasks`}
      description={`Review the lesson content and tasks for ${subtopic?.title || 'this PM topic'} with practical examples and learning resources.`}
      canonical={`https://producttasks.com/dashboard/topics/lessons/${subtopic?.id || ''}`}
      keywords={['product management lesson', 'PM learning', subtopic?.title || 'lesson']}
    />
  );

  useEffect(() => {
    async function fetchData() {
      const [subtopicResult, contentResult, tasksResult, completionsResult, resourcesResult] = await Promise.all([
        supabase.from('subtopics').select('*').eq('id', subtopicId).maybeSingle(),
        supabase.from('content').select('*').eq('subtopic_id', subtopicId).order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').eq('subtopic_id', subtopicId).order('order_index', { ascending: true }),
        user ? supabase.from('tasks_completion').select('*').eq('user_id', user.id) : { data: [], error: null },
        supabase.from('resources').select('*').eq('subtopic_id', subtopicId).order('created_at', { ascending: true })
      ]);

      if (subtopicResult.error) {
        console.error('Error fetching subtopic:', subtopicResult.error);
      } else {
        setSubtopic(subtopicResult.data);
      }

      if (contentResult.error) {
        console.error('Error fetching content:', contentResult.error);
      } else {
        setContent(contentResult.data || []);
      }

      if (tasksResult.error) {
        console.error('Error fetching tasks:', tasksResult.error);
      } else {
        setTasks(tasksResult.data || []);
      }

      if (completionsResult.error) {
        console.error('Error fetching completions:', completionsResult.error);
      } else {
        setCompletions(completionsResult.data || []);
      }

      if (resourcesResult.error) {
        console.error('Error fetching resources:', resourcesResult.error);
      } else {
        setResources(resourcesResult.data || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [subtopicId, user]);

  if (loading) {
    return (
      <main className="p-8">
        {seo}
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading lesson...</p>
        </div>
      </main>
    );
  }

  if (!subtopic) {
    return (
      <main className="p-8">
        {seo}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <p className="text-white">Lesson not found</p>
      </main>
    );
  }

  const handleTaskComplete = async (taskId: string) => {
    if (!user) return;

    try {
      // Update local state immediately for better UX
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: true } : task
    ));

      // Save to database
      const { error } = await supabase
        .from('tasks_completion')
        .upsert({
          user_id: user.id,
          tasks_id: taskId,
          completed: true,
          completed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving task completion:', error);
        // Revert local state on error
        setTasks(tasks.map(task =>
          task.id === taskId ? { ...task, completed: false } : task
        ));
      } else {
        // Refresh completions data
        const { data } = await supabase
          .from('tasks_completion')
          .select('*')
          .eq('user_id', user.id);
        setCompletions(data || []);
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const completedTasks = tasks.filter(task => 
    completions.some(c => c.tasks_id === task.id && c.completed)
  ).length;

  const renderHTMLContent = (htmlContent: string): string => {
    if (!htmlContent) return '';
    
    try {
      return DOMPurify.sanitize(htmlContent, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'span', 'div'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id']
      });
    } catch (error) {
      console.error('Error sanitizing HTML content:', error);
      return htmlContent; // Fallback to original content if sanitization fails
    }
  };

  const getResourceIcon = (type: string | null) => {
    switch (type) {
      case 'article':
        return <FileText className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'word':
        return <FileText className="w-4 h-4" />;
      case 'other':
        return <Link2 className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <main className="p-8">
      {seo}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Topic</span>
      </button>

      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-50"></div>
            <div className="relative inline-flex px-6 py-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">{subtopic.title}</h1>
          <p className="text-slate-400 text-lg">{subtopic.description}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {content.map((contentItem) => (
              <div key={contentItem.id} className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
                <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800">
                  {contentItem.content_heading && (
                    <h2 className="text-2xl font-bold text-white mb-4">{contentItem.content_heading}</h2>
                  )}
                  <div className="space-y-4">
                    {contentItem.content_text ? (
                      <div 
                        className="text-slate-300 leading-relaxed prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: renderHTMLContent(contentItem.content_text)
                        }}
                      />
                    ) : (
                      <p className="text-slate-400 italic">No content available for this section.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {content.length === 0 && (
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
                <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800 text-center">
                  <p className="text-slate-400">No content available for this lesson yet.</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-20"></div>
                <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Practice Tasks</h3>
                    <span className="text-cyan-400 text-sm font-semibold">
                      {completedTasks}/{tasks.length}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-6">
                    Complete these tasks to reinforce your learning
                  </p>

                  <div className="space-y-3">
                    {tasks.length > 0 ? (
                      tasks.map((task) => {
                        const isCompleted = completions.some(c => c.tasks_id === task.id && c.completed);
                        return (
                          <button
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="w-full group relative"
                          >
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                            <div className={`relative bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border transition-all duration-300 ${
                              isCompleted
                                ? 'border-green-500/50 bg-green-500/5'
                                : 'border-slate-700 group-hover:border-cyan-500/50'
                            }`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className={`font-semibold text-left ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                                    {task.title}
                                  </h4>
                                  {task.category && (
                                    <span className="text-xs text-slate-500 mt-1 block">
                                      {task.category}
                                    </span>
                                  )}
                                </div>
                                {isCompleted && (
                                  <CheckSquare className="w-5 h-5 text-green-400 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center space-x-1 text-slate-400 text-xs">
                                  <Clock className="w-3 h-3" />
                                  <span>{task.duration || 'N/A'}</span>
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-400 text-sm">No tasks available for this lesson yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl blur opacity-10"></div>
                <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Resources</h3>
                    <span className="text-emerald-400 text-sm font-semibold">
                      {resources.length} items
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-6">
                    Additional materials to enhance your learning
                  </p>

                  <div className="space-y-3">
                    {resources.length > 0 ? (
                      resources.map((resource) => (
                        <a
                          key={resource.id}
                          href={resource.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                {getResourceIcon(resource.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white mb-1">
                                  {resource.title}
                                </h4>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                  {resource.description}
                                </p>
                                <div className="flex items-center mt-2">
                                  <span className="text-xs text-emerald-400 font-medium capitalize">
                                    {resource.type}
                                  </span>
                                  <ExternalLink className="w-3 h-3 text-slate-500 ml-2" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No resources available for this lesson yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        task={selectedTask ? {
          title: selectedTask.title,
          description: selectedTask.description,
          duration: selectedTask.duration,
          category: selectedTask.category,
          subtopic_id: selectedTask.subtopic_id
        } : {
          title: '',
          description: null,
          duration: null,
          category: null,
          subtopic_id: null
        }}
        onComplete={() => {
          if (selectedTask) {
            handleTaskComplete(selectedTask.id);
          }
        }}
        isCompleted={selectedTask ? completions.some(c => c.tasks_id === selectedTask.id && c.completed) : false}
      />
    </main>
  );
}
