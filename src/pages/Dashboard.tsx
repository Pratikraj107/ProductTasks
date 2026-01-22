import { TrendingUp, Target, Calendar, Award, ArrowRight, BookOpen, CheckSquare, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { TasksCompletion, Subtopic, Task } from '../lib/database.types';

interface DashboardStats {
  learningStreak: number;
  topicsCompleted: number;
  totalTopics: number;
  tasksCompleted: number;
  totalTasks: number;
  achievements: number;
}

interface RecentActivity {
  id: string;
  title: string;
  time: string;
  type: 'topic' | 'task' | 'achievement' | 'community';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    learningStreak: 0,
    topicsCompleted: 0,
    totalTopics: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    achievements: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) {
        console.log('No user found, skipping dashboard data fetch');
        setLoading(false);
        return;
      }

      console.log('Fetching dashboard data for user:', user.id);

      try {
        // Fetch all data in parallel
        const [
          tasksResult,
          completionsResult,
          subtopicsResult,
          topicsResult
        ] = await Promise.all([
          supabase.from('tasks').select('*'),
          supabase.from('tasks_completion').select('*').eq('user_id', user.id),
          supabase.from('subtopics').select('*'),
          supabase.from('topics').select('*')
        ]);

        console.log('Raw data fetched:', {
          tasks: tasksResult.data?.length || 0,
          completions: completionsResult.data?.length || 0,
          subtopics: subtopicsResult.data?.length || 0,
          topics: topicsResult.data?.length || 0
        });

        console.log('Tasks data:', tasksResult.data);
        console.log('Completions data:', completionsResult.data);

        // Check for errors
        if (tasksResult.error) console.error('Tasks error:', tasksResult.error);
        if (completionsResult.error) console.error('Completions error:', completionsResult.error);
        if (subtopicsResult.error) console.error('Subtopics error:', subtopicsResult.error);
        if (topicsResult.error) console.error('Topics error:', topicsResult.error);

        // Calculate statistics from tasks_completion table
        const totalTasks = tasksResult.data?.length || 0;
        const userCompletions = completionsResult.data || [];
        const completedTasks = userCompletions.filter(c => c.completed === true).length;
        const totalTopics = topicsResult.data?.length || 0;

        console.log('User completions data:', userCompletions);
        console.log('Completed tasks count:', completedTasks);
        console.log('Total tasks available:', totalTasks);

        // Calculate topics completed (based on unique subtopics with completed tasks)
        const completedSubtopics = new Set(
          userCompletions
            .filter(c => c.completed === true)
            .map(c => {
              const task = tasksResult.data?.find(t => t.id === c.tasks_id);
              return task?.subtopic_id;
            })
            .filter(Boolean) || []
        );
        const topicsCompleted = completedSubtopics.size;

        // Calculate learning streak based on recent completions
        const learningStreak = calculateLearningStreak(userCompletions);

        // Calculate achievements (1 achievement per 5 completed tasks)
        const achievements = Math.floor(completedTasks / 5);

        // Generate recent activity
        const activity = generateRecentActivity(userCompletions, tasksResult.data || []);

        const finalStats = {
          learningStreak,
          topicsCompleted,
          totalTopics,
          tasksCompleted: completedTasks,
          totalTasks,
          achievements
        };

        console.log('Final calculated stats:', finalStats);
        console.log('Recent activity generated:', activity);

        // Always set real data, no sample data fallback
        setStats(finalStats);
        setRecentActivity(activity);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      if (!user) return;

      console.log('Manually refreshing dashboard data for user:', user.id);

      // Fetch all data in parallel
      const [
        tasksResult,
        completionsResult,
        subtopicsResult,
        topicsResult
      ] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('tasks_completion').select('*').eq('user_id', user.id),
        supabase.from('subtopics').select('*'),
        supabase.from('topics').select('*')
      ]);

      console.log('Refreshed data:', {
        tasks: tasksResult.data?.length || 0,
        completions: completionsResult.data?.length || 0,
        subtopics: subtopicsResult.data?.length || 0,
        topics: topicsResult.data?.length || 0
      });

      // Calculate statistics from tasks_completion table
      const totalTasks = tasksResult.data?.length || 0;
      const userCompletions = completionsResult.data || [];
      const completedTasks = userCompletions.filter(c => c.completed === true).length;
      const totalTopics = topicsResult.data?.length || 0;

      // Calculate topics completed (based on unique subtopics with completed tasks)
      const completedSubtopics = new Set(
        userCompletions
          .filter(c => c.completed === true)
          .map(c => {
            const task = tasksResult.data?.find(t => t.id === c.tasks_id);
            return task?.subtopic_id;
          })
          .filter(Boolean) || []
      );
      const topicsCompleted = completedSubtopics.size;

      // Calculate learning streak based on recent completions
      const learningStreak = calculateLearningStreak(userCompletions);

      // Calculate achievements (1 achievement per 5 completed tasks)
      const achievements = Math.floor(completedTasks / 5);

      // Generate recent activity
      const activity = generateRecentActivity(userCompletions, tasksResult.data || []);

      const finalStats = {
        learningStreak,
        topicsCompleted,
        totalTopics,
        tasksCompleted: completedTasks,
        totalTasks,
        achievements
      };

      setStats(finalStats);
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const calculateLearningStreak = (completions: TasksCompletion[]): number => {
    if (!completions.length) return 0;

    console.log('Calculating learning streak for completions:', completions);

    // Filter only completed tasks with completion dates
    const completedTasks = completions.filter(c => c.completed === true && c.completed_at);
    
    if (!completedTasks.length) {
      console.log('No completed tasks with dates found');
      return 0;
    }

    // Get unique completion dates (only the date part, not time)
    const completionDates = [...new Set(
      completedTasks.map(c => new Date(c.completed_at!).toDateString())
    )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    console.log('Unique completion dates:', completionDates);

    // Calculate consecutive days starting from today or yesterday
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    // Check if user completed tasks today
    const todayString = today.toDateString();
    const hasTodayCompletion = completionDates.includes(todayString);
    
    // If no completion today, check if they completed yesterday (allow 1 day gap)
    let startDate = today;
    if (!hasTodayCompletion) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      
      if (completionDates.includes(yesterdayString)) {
        startDate = yesterday;
        streak = 1; // Start with 1 for yesterday
      } else {
        console.log('No completion today or yesterday, streak is 0');
        return 0;
      }
    }

    // Count consecutive days backwards from start date
    for (let i = 1; i < completionDates.length; i++) {
      const expectedDate = new Date(startDate);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateString = expectedDate.toDateString();

      console.log(`Checking day ${i}: looking for ${expectedDateString} in completions`);

      if (completionDates.includes(expectedDateString)) {
        streak++;
      } else {
        break;
      }
    }

    console.log('Final calculated streak:', streak);
    return streak;
  };

  const generateRecentActivity = (completions: TasksCompletion[], tasks: Task[]): RecentActivity[] => {
    const activities: RecentActivity[] = [];

    console.log('Generating recent activity from:', { completions: completions.length, tasks: tasks.length });

    // Add recent task completions
    const completedTasks = completions.filter(c => c.completed === true && c.completed_at);
    console.log('Completed tasks with dates:', completedTasks);

    completedTasks
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      .slice(0, 5)
      .forEach(completion => {
        const task = tasks.find(t => t.id === completion.tasks_id);
        console.log(`Looking for task ${completion.tasks_id}, found:`, task);
        if (task) {
          activities.push({
            id: completion.id,
            title: `Completed Task: ${task.title}`,
            time: formatTimeAgo(completion.completed_at!),
            type: 'task'
          });
        }
      });

    console.log('Generated activities:', activities);
    return activities.slice(0, 4); // Limit to 4 activities
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Dashboard</h1>
            <p className="text-slate-400">Track your progress and achievements</p>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-all duration-300">
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-slate-400 text-sm mb-1">Learning Streak</p>
            <p className="text-3xl font-bold text-white">{stats.learningStreak} Day{stats.learningStreak !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-all duration-300">
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white mb-4">
              <Target className="w-6 h-6" />
            </div>
            <p className="text-slate-400 text-sm mb-1">Topics Completed</p>
            <p className="text-3xl font-bold text-white">{stats.topicsCompleted}/{stats.totalTopics}</p>
          </div>
        </div>

        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-all duration-300">
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-slate-400 text-sm mb-1">Tasks Done</p>
            <p className="text-3xl font-bold text-white">{stats.tasksCompleted}/{stats.totalTasks}</p>
          </div>
        </div>

        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-600 to-rose-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-all duration-300">
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white mb-4">
              <Award className="w-6 h-6" />
            </div>
            <p className="text-slate-400 text-sm mb-1">Achievements</p>
            <p className="text-3xl font-bold text-white">{stats.achievements}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all duration-200 cursor-pointer"
                  >
                    <div className={`w-2 h-2 mt-2 rounded-full ${
                      activity.type === 'task' ? 'bg-cyan-500' :
                      activity.type === 'topic' ? 'bg-green-500' :
                      activity.type === 'achievement' ? 'bg-pink-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">{activity.title}</p>
                      <p className="text-slate-400 text-sm">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No recent activity</p>
                  <p className="text-slate-500 text-sm">Complete some tasks to see your progress here!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-6">Your Learning Path</h2>
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold">Foundation Phase</h3>
                  <span className="text-cyan-400 text-sm font-semibold">
                    {stats.tasksCompleted > 0 ? 'In Progress' : 'Start Learning'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.totalTasks > 0 ? (stats.tasksCompleted / stats.totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-slate-400 text-sm mb-4">
                  Complete {stats.tasksCompleted} of {stats.totalTasks} tasks to master Product Management fundamentals
                </p>
                <button 
                  onClick={() => window.location.href = '#tasks'}
                  className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-semibold"
                >
                  <span>{stats.tasksCompleted > 0 ? 'Continue Learning' : 'Start Learning'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className={`p-5 rounded-xl border ${
                stats.tasksCompleted >= Math.floor(stats.totalTasks * 0.3) 
                  ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30' 
                  : 'bg-slate-800/30 border-slate-700'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-bold ${
                    stats.tasksCompleted >= Math.floor(stats.totalTasks * 0.3) 
                      ? 'text-white' 
                      : 'text-slate-400'
                  }`}>Practice Phase</h3>
                  <span className={`text-sm font-semibold ${
                    stats.tasksCompleted >= Math.floor(stats.totalTasks * 0.3) 
                      ? 'text-green-400' 
                      : 'text-slate-500'
                  }`}>
                    {stats.tasksCompleted >= Math.floor(stats.totalTasks * 0.3) ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
                <p className={`text-sm ${
                  stats.tasksCompleted >= Math.floor(stats.totalTasks * 0.3) 
                    ? 'text-slate-400' 
                    : 'text-slate-500'
                }`}>
                  {stats.tasksCompleted >= Math.floor(stats.totalTasks * 0.3) 
                    ? 'Apply your knowledge with real-world scenarios' 
                    : `Complete ${Math.floor(stats.totalTasks * 0.3) - stats.tasksCompleted} more tasks to unlock`
                  }
                </p>
              </div>

              <div className={`p-5 rounded-xl border ${
                stats.tasksCompleted >= Math.floor(stats.totalTasks * 0.7) 
                  ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30' 
                  : 'bg-slate-800/30 border-slate-700'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-bold ${
                    stats.tasksCompleted >= Math.floor(stats.totalTasks * 0.7) 
                      ? 'text-white' 
                      : 'text-slate-400'
                  }`}>Mastery Phase</h3>
                  <span className={`text-sm font-semibold ${
                    stats.tasksCompleted >= Math.floor(stats.totalTasks * 0.7) 
                      ? 'text-purple-400' 
                      : 'text-slate-500'
                  }`}>
                    {stats.tasksCompleted >= Math.floor(stats.totalTasks * 0.7) ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
                <p className={`text-sm ${
                  stats.tasksCompleted >= Math.floor(stats.totalTasks * 0.7) 
                    ? 'text-slate-400' 
                    : 'text-slate-500'
                }`}>
                  {stats.tasksCompleted >= Math.floor(stats.totalTasks * 0.7) 
                    ? 'Become a Product Management expert' 
                    : `Complete ${Math.floor(stats.totalTasks * 0.7) - stats.tasksCompleted} more tasks to unlock`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
