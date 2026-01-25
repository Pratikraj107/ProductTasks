import { CheckCircle2, Circle, Calendar, Clock, BookOpen, ArrowRight, KanbanSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import TaskModal from '../components/TaskModal';
import type { Task, TasksCompletion } from '../lib/database.types';

interface TasksProps {
  onNavigateToSubtopic?: (subtopicId: string) => Promise<void>;
}

export default function Tasks({ onNavigateToSubtopic }: TasksProps = {}) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TasksCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [boardView, setBoardView] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [tasksResult, completionsResult] = await Promise.all([
        supabase.from('tasks').select('*').order('order_index', { ascending: true }),
        user ? supabase.from('tasks_completion').select('*').eq('user_id', user.id) : { data: [], error: null }
      ]);

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

      setLoading(false);
    }

    fetchData();
  }, [user]);

  const handleTaskComplete = async (taskId: string) => {
    if (!user) return;

    try {
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

  const handleLearnMore = async (subtopicId: string) => {
    if (onNavigateToSubtopic) {
      await onNavigateToSubtopic(subtopicId);
    }
  };

  const getCategoryColor = (category: string | null) => {
    if (!category) return 'bg-slate-500/20 text-slate-400';
    
    switch (category) {
      case 'Reading': return 'bg-blue-500/20 text-blue-400';
      case 'Video': return 'bg-purple-500/20 text-purple-400';
      case 'Exercise': return 'bg-cyan-500/20 text-cyan-400';
      case 'Assessment': return 'bg-green-500/20 text-green-400';
      case 'Community': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const completedTasks = tasks.filter(task => 
    completions.some(c => c.tasks_id === task.id && c.completed)
  ).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // --- Board helpers
  const getTaskStatus = (taskId: string): 'todo' | 'inprogress' | 'completed' => {
    const entry = completions.find(c => c.tasks_id === taskId);
    if (entry?.completed) return 'completed';
    if (entry?.inProgress) return 'inprogress';
    return 'todo';
  };

  const getStatusPill = (taskId: string) => {
    const status = getTaskStatus(taskId);
    switch (status) {
      case 'completed':
        return { label: 'Completed', className: 'bg-green-500/15 text-green-400 border border-green-500/30' };
      case 'inprogress':
        return { label: 'In Progress', className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' };
      default:
        return { label: 'To Do', className: 'bg-slate-500/15 text-slate-300 border border-slate-600/30' };
    }
  };

  const setTaskStatus = async (taskId: string, status: 'todo' | 'inprogress' | 'completed') => {
    if (!user) return;
    const update: Partial<TasksCompletion> = {
      user_id: user.id,
      tasks_id: taskId,
      completed: status === 'completed',
      inProgress: status === 'inprogress',
      ToDo: status === 'todo'
    };
    if (status === 'completed') {
      (update as any).completed_at = new Date().toISOString();
    }

    // Try update first (no unique index required)
    const { data: updatedData, error: updateError } = await supabase
      .from('tasks_completion')
      .update(update)
      .eq('user_id', user.id)
      .eq('tasks_id', taskId)
      .select('id');

    if (updateError) {
      console.error('Error updating status:', updateError);
    }

    if (!updatedData || updatedData.length === 0) {
      const { error: insertError } = await supabase
        .from('tasks_completion')
        .insert(update);
      if (insertError) {
        console.error('Error inserting status:', insertError);
      }
    }
    const { data } = await supabase
      .from('tasks_completion')
      .select('*')
      .eq('user_id', user.id);
    setCompletions(data || []);
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    // Needed for Firefox
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, status: 'todo' | 'inprogress' | 'completed') => {
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    setTaskStatus(taskId, status);
  };

  const allowDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">30-Day AI Product Management Sprint</h1>
            <p className="text-slate-400">Stay on track with your daily learning goals</p>
          </div>
          <button
            onClick={() => setBoardView(!boardView)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold"
          >
            <KanbanSquare className="w-4 h-4" />
            <span>{boardView ? 'List View' : 'TaskBoard View'}</span>
          </button>
        </div>
      </div>

      {!boardView && (
      <div className="mb-8 relative">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
        <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Today's Progress</h2>
            <span className="text-cyan-400 font-semibold">{completedTasks}/{totalTasks} completed</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
      )}

      {!boardView ? (
      <div className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const isCompleted = completions.some(c => c.tasks_id === task.id && c.completed);
            return (
              <div
                key={task.id}
                className={`group relative ${isCompleted ? 'opacity-60' : ''}`}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all duration-300 flex items-center space-x-4">
                  <button 
                    onClick={() => handleTaskComplete(task.id)}
                    className="flex-shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-600 hover:text-cyan-500 transition-colors" />
                    )}
                  </button>

                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    <h3 className={`font-semibold mb-2 ${isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center space-x-3 text-sm">
                      {task.category && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(task.category)}`}>
                          {task.category}
                        </span>
                      )}
                      {task.duration && (
                        <span className="flex items-center space-x-1 text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{task.duration}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {(() => { const pill = getStatusPill(task.id); return (
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${pill.className}`}>
                        {pill.label}
                      </span>
                    ); })()}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No tasks available</h3>
            <p className="text-slate-500">Tasks will appear here once they are added to the system.</p>
          </div>
        )}
      </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { key: 'todo', title: 'To Do', gradient: 'from-slate-600 to-slate-500' },
            { key: 'inprogress', title: 'In Progress', gradient: 'from-orange-600 to-amber-600' },
            { key: 'completed', title: 'Completed', gradient: 'from-green-600 to-emerald-600' },
          ].map((col) => (
            <div key={col.key} className="relative">
              <div className={`absolute -inset-0.5 bg-gradient-to-br ${col.gradient} rounded-2xl blur opacity-10 pointer-events-none`}></div>
              <div
                className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-4 border border-slate-800 min-h-[420px]"
                onDragOver={allowDrop}
                onDragEnter={allowDrop}
                onDrop={(e) => onDrop(e, col.key as any)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">{col.title}</h3>
                </div>
                <div className="space-y-3">
                  {tasks
                    .filter(t => {
                      const status = getTaskStatus(t.id);
                      return status === (col.key as any);
                    })
                    .map(t => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, t.id)}
                        className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 cursor-move"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold pr-2 truncate">{t.title}</h4>
                          {col.key === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          {t.category && <span className={`px-2 py-0.5 rounded ${getCategoryColor(t.category)}`}>{t.category}</span>}
                          {t.duration && (
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" /><span>{t.duration}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
                {/* Empty state */}
                {tasks.filter(t => getTaskStatus(t.id) === (col.key as any)).length === 0 && (
                  <div className="text-center text-slate-500 text-sm py-8">No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!boardView && (
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl blur opacity-10"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Tasks</span>
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold text-white">{totalTasks}</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl blur opacity-10"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Completed</span>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white">{completedTasks}</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl blur opacity-10"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Remaining</span>
              <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-white">{totalTasks - completedTasks}</p>
          </div>
        </div>
      </div>
      )}

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
        currentStatus={selectedTask ? getTaskStatus(selectedTask.id) : 'todo'}
        onChangeStatus={async (status) => {
          if (!selectedTask) return;
          await setTaskStatus(selectedTask.id, status);
        }}
        onLearnMore={selectedTask?.subtopic_id ? () => handleLearnMore(selectedTask.subtopic_id!) : undefined}
        isCompleted={selectedTask ? completions.some(c => c.tasks_id === selectedTask.id && c.completed) : false}
      />
    </div>
  );
}
