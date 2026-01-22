import { ArrowLeft, Play, CheckCircle2, Lock, BookOpen, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Topic, Subtopic, UserProgress } from '../lib/database.types';

interface TopicDetailProps {
  topicId: string;
  onBack: () => void;
  onSubtopicClick: (subtopicId: string) => void;
}

export default function TopicDetail({ topicId, onBack, onSubtopicClick }: TopicDetailProps) {
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [topicResult, subtopicsResult, progressResult] = await Promise.all([
        supabase.from('topics').select('*').eq('id', topicId).maybeSingle(),
        supabase.from('subtopics').select('*').eq('topic_id', topicId).order('order_index', { ascending: true }),
        user ? supabase.from('user_progress').select('*').eq('user_id', user.id) : { data: [], error: null }
      ]);

      if (topicResult.error) {
        console.error('Error fetching topic:', topicResult.error);
      } else {
        setTopic(topicResult.data);
      }

      if (subtopicsResult.error) {
        console.error('Error fetching subtopics:', subtopicsResult.error);
      } else {
        setSubtopics(subtopicsResult.data || []);
      }

      if (progressResult.error) {
        console.error('Error fetching progress:', progressResult.error);
      } else {
        setProgress(progressResult.data || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [topicId, user]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="p-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Topics</span>
        </button>
        <p className="text-slate-900 dark:text-white">Topic not found</p>
      </div>
    );
  }

  const completedSubtopics = subtopics.filter(s =>
    progress.some(p => p.subtopic_id === s.id && p.is_completed)
  ).length;
  const totalSubtopics = subtopics.length;
  const progressPercent = totalSubtopics > 0 ? (completedSubtopics / totalSubtopics) * 100 : 0;
  const topicGradient = topic.gradient || 'from-blue-500 to-cyan-500';

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Topics</span>
      </button>

      <div className="mb-8">
        <div className="relative inline-block mb-4">
          <div className={`absolute inset-0 bg-gradient-to-br ${topicGradient} rounded-2xl blur-xl opacity-50`}></div>
          <div className={`relative inline-flex px-6 py-3 rounded-2xl bg-gradient-to-br ${topicGradient} text-white`}>
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">{topic.title}</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">{topic.description}</p>
      </div>

      <div className="mb-8 relative">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
        <div className="relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Course Progress</h2>
            <span className="text-cyan-400 font-semibold">{completedSubtopics}/{totalSubtopics} completed</span>
          </div>
          <div className="w-full bg-slate-300 dark:bg-slate-800 rounded-full h-3">
            <div
              className={`bg-gradient-to-r ${topicGradient} h-3 rounded-full transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {subtopics.map((subtopic, index) => {
          const isCompleted = progress.some(p => p.subtopic_id === subtopic.id && p.is_completed);

          return (
            <div key={subtopic.id} className="group relative">
              <div className={`absolute -inset-0.5 bg-gradient-to-br ${topicGradient} rounded-2xl blur opacity-0 ${!subtopic.is_locked ? 'group-hover:opacity-30' : ''} transition duration-300`}></div>
              <div
                className={`relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-slate-800 ${!subtopic.is_locked ? 'hover:border-cyan-500/50 cursor-pointer' : ''} transition-all duration-300`}
                onClick={() => !subtopic.is_locked && onSubtopicClick(subtopic.id)}
              >
                <div className="flex items-start space-x-6">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800/50 flex items-center justify-center font-bold ${subtopic.is_locked ? 'text-slate-400 dark:text-slate-600' : isCompleted ? 'text-green-400' : 'text-cyan-400'}`}>
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-2 ${subtopic.is_locked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                          {subtopic.title}
                        </h3>
                        <p className={`text-sm mb-4 ${subtopic.is_locked ? 'text-slate-400 dark:text-slate-600' : 'text-slate-600 dark:text-slate-400'}`}>
                          {subtopic.description}
                        </p>
                      </div>
                      {isCompleted && (
                        <div className="ml-4 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </div>
                      )}
                      {subtopic.is_locked && (
                        <div className="ml-4 bg-slate-200 dark:bg-slate-800/50 text-slate-500 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className={`flex items-center space-x-1 ${subtopic.is_locked ? 'text-slate-400 dark:text-slate-600' : 'text-slate-600 dark:text-slate-400'}`}>
                          <BookOpen className="w-4 h-4" />
                          <span>{subtopic.lesson_count} Lessons</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${subtopic.is_locked ? 'text-slate-400 dark:text-slate-600' : 'text-slate-600 dark:text-slate-400'}`}>
                          <Clock className="w-4 h-4" />
                          <span>{subtopic.duration}</span>
                        </span>
                      </div>

                      {!subtopic.is_locked && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSubtopicClick(subtopic.id);
                          }}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                          isCompleted
                            ? 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700'
                        }`}>
                          <Play className="w-4 h-4" />
                          <span>{isCompleted ? 'Review' : 'Start Learning'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl blur opacity-10"></div>
          <div className="relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 dark:text-slate-400 text-sm">Total Lessons</span>
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{subtopics.reduce((acc, s) => acc + s.lesson_count, 0)}</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl blur opacity-10"></div>
          <div className="relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 dark:text-slate-400 text-sm">Completed</span>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{completedSubtopics}/{totalSubtopics}</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl blur opacity-10"></div>
          <div className="relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 dark:text-slate-400 text-sm">Time Remaining</span>
              <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {subtopics
                .filter(s => !progress.some(p => p.subtopic_id === s.id && p.is_completed))
                .reduce((acc, s) => acc + parseInt(s.duration || '0'), 0)} min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
