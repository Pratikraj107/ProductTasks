import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BookOpen, FileText, MessageSquare, Users, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    topics: 0,
    subtopics: 0,
    lessons: 0,
    interviewQuestions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [topicsRes, subtopicsRes, contentRes, questionsRes] = await Promise.all([
        supabase.from('topics').select('id', { count: 'exact', head: true }),
        supabase.from('subtopics').select('id', { count: 'exact', head: true }),
        supabase.from('content').select('id', { count: 'exact', head: true }),
        supabase.from('interview_questions').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        topics: topicsRes.count || 0,
        subtopics: subtopicsRes.count || 0,
        lessons: contentRes.count || 0,
        interviewQuestions: questionsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Topics', value: stats.topics, icon: <BookOpen className="w-6 h-6" />, color: 'from-blue-500 to-cyan-500' },
    { label: 'Subtopics', value: stats.subtopics, icon: <FileText className="w-6 h-6" />, color: 'from-green-500 to-emerald-500' },
    { label: 'Lessons', value: stats.lessons, icon: <FileText className="w-6 h-6" />, color: 'from-purple-500 to-pink-500' },
    { label: 'Interview Questions', value: stats.interviewQuestions, icon: <MessageSquare className="w-6 h-6" />, color: 'from-orange-500 to-red-500' },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage your content and track statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} bg-opacity-10`}>
                <div className={`text-white bg-gradient-to-r ${stat.color} p-2 rounded-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Content Management</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Add, edit, or delete topics, subtopics, and lessons
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Interview Questions</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage interview questions and answers
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">User Management</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              View and manage user accounts (Coming soon)
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Analytics</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              View detailed analytics and reports (Coming soon)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
