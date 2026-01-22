import { X, CheckCircle2, Clock, Flag, BookOpen, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    title: string;
    description: string | null;
    duration: string | null;
    category: string | null;
    subtopic_id?: string | null;
  };
  onComplete?: () => void;
  currentStatus?: 'todo' | 'inprogress' | 'completed';
  onChangeStatus?: (status: 'todo' | 'inprogress' | 'completed') => void;
  onLearnMore?: () => Promise<void>;
  isCompleted?: boolean;
}

export default function TaskModal({ isOpen, onClose, task, onComplete, currentStatus = 'todo', onChangeStatus, onLearnMore, isCompleted = false }: TaskModalProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getCategoryColor = (category: string | null) => {
    if (!category) return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    
    switch (category.toLowerCase()) {
      case 'reading':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'video':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'exercise':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'assessment':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'community':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-30"></div>
        <div className="relative bg-slate-900 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl">
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 p-6 rounded-t-3xl z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">{task.title}</h2>
                <div className="flex items-center space-x-3">
                  {task.category && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(task.category)}`}>
                      {task.category}
                    </span>
                  )}
                  {task.duration && (
                    <span className="flex items-center space-x-1 text-slate-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{task.duration}</span>
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 ml-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {task.description && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Description</h3>
                <p className="text-slate-300 leading-relaxed">{task.description}</p>
              </div>
            )}

            {!task.description && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Description</h3>
                <p className="text-slate-400 italic">No description available for this task.</p>
              </div>
            )}

            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-5 border border-blue-500/30">
                <div className="flex items-start space-x-3">
                  <Flag className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Pro Tip</h4>
                    <p className="text-slate-300 text-sm">
                      Take your time to understand the concepts before attempting the task.
                      Feel free to reference the lesson content as needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-6 rounded-b-3xl">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
              >
                Close
              </button>
              <div className="flex items-center space-x-3">
                <label className="text-slate-400 text-sm">Status</label>
                <select
                  value={currentStatus}
                  onChange={(e) => onChangeStatus && onChangeStatus(e.target.value as any)}
                  className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                >
                  <option value="todo">To Do</option>
                  <option value="inprogress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            
            {onLearnMore && task.subtopic_id && (
              <button
                onClick={async () => {
                  setIsNavigating(true);
                  try {
                    await onLearnMore();
                    onClose();
                  } catch (error) {
                    console.error('Error navigating to lesson:', error);
                  } finally {
                    setIsNavigating(false);
                  }
                }}
                disabled={isNavigating}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-500 disabled:to-emerald-500 text-white font-semibold transition-all flex items-center justify-center space-x-2"
              >
                {isNavigating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5" />
                    <span>Learn more about the topic</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
