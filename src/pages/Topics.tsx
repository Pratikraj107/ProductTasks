import { Compass, Target, Users, Calendar, TrendingUp, CheckCircle2, Lightbulb } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Topic } from '../lib/database.types';
import SEOHead from '../components/SEOHead';

interface TopicsProps {
  onTopicClick: (topicId: string) => void;
}

const iconMap: Record<string, any> = {
  compass: Compass,
  target: Target,
  users: Users,
  calendar: Calendar,
  'trending-up': TrendingUp,
  'check-circle': CheckCircle2,
  lightbulb: Lightbulb
};

export default function Topics({ onTopicClick }: TopicsProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const seo = (
    <SEOHead
      title="Product Management Learning Path — ProductTasks"
      description="Explore ProductTasks structured PM learning path with topics, lessons, and progress tracking to master product management skills."
      canonical="https://producttasks.com/dashboard/topics"
      keywords={['product management learning path', 'PM topics', 'product strategy learning']}
    />
  );

  useEffect(() => {
    async function fetchTopics() {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching topics:', error);
      } else {
        setTopics(data || []);
      }
      setLoading(false);
    }

    fetchTopics();
  }, []);

  if (loading) {
    return (
      <main className="p-8">
        {seo}
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading topics...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      {seo}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-4">Learning Path</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">Master product management through structured learning</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => {
            const IconComponent = topic.icon ? iconMap[topic.icon] || Compass : Compass;
            const topicGradient = topic.gradient || 'from-blue-500 to-cyan-500';

            return (
              <div
                key={topic.id}
                className="group relative"
                onClick={() => onTopicClick(topic.id)}
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-br ${topicGradient} rounded-3xl blur opacity-0 group-hover:opacity-30 transition duration-300`}></div>
                <div className="relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all duration-300">
                  <div className={`mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br ${topicGradient}`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{topic.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">{topic.description}</p>

                  <button
                    className="w-full mt-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-2 rounded-lg font-semibold transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTopicClick(topic.id);
                    }}
                  >
                    Start Learning
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
