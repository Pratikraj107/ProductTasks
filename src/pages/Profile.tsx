import { User, Mail, Calendar, Award, Edit2, Shield, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useInterviewUsage } from '../hooks/useInterviewUsage';

export default function Profile() {
  const { user } = useAuth();
  const { usageStatus } = useInterviewUsage();
  const isFreeUser = !usageStatus || usageStatus.plan_type === 'free';

  const achievements = [
    { title: 'Early Adopter', description: 'Joined ProductTasks', icon: '🚀', earned: true },
    { title: 'Quick Learner', description: 'Completed 5 topics', icon: '⚡', earned: true },
    { title: 'Consistent', description: '7 day streak', icon: '🔥', earned: true },
    { title: 'Community Helper', description: 'Helped 10 members', icon: '🤝', earned: false },
    { title: 'Interview Pro', description: 'Completed 50 questions', icon: '💼', earned: false },
    { title: 'Master', description: 'Completed all topics', icon: '🏆', earned: false },
  ];

  const stats = [
    { label: 'Topics Completed', value: '12', total: '50' },
    { label: 'Tasks Finished', value: '24', total: '100' },
    { label: 'Learning Streak', value: '7 days', total: null },
    { label: 'Achievements', value: '3', total: '15' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Profile</h1>
        <p className="text-slate-400">Manage your account and track your progress</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-20"></div>
            <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-xl opacity-50"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Your Profile</h2>
                <p className="text-slate-400 text-sm">{user?.email}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 rounded-xl bg-slate-800/50">
                  <Mail className="w-5 h-5 text-cyan-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-400 text-xs">Email</p>
                    <p className="text-white text-sm truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-xl bg-slate-800/50">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-slate-400 text-xs">Member Since</p>
                    <p className="text-white text-sm">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-xl bg-slate-800/50">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-slate-400 text-xs">Account Type</p>
                    <p className="text-white text-sm capitalize">{usageStatus?.plan_type || 'Free'}</p>
                  </div>
                </div>
              </div>

              {isFreeUser && (
                <button
                  onClick={() => {
                    window.location.href = '/#pricing';
                  }}
                  className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-lg font-bold hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center space-x-2 shadow-lg"
                >
                  <Zap className="w-4 h-4" />
                  <span>Upgrade to Pro</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button className="w-full mt-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center space-x-2">
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
            <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
              <h2 className="text-2xl font-bold text-white mb-6">Your Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                    <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">
                      {stat.value}
                      {stat.total && <span className="text-slate-500 text-lg">/{stat.total}</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
            <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
              <div className="flex items-center space-x-3 mb-6">
                <Award className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-white">Achievements</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`rounded-xl p-5 border transition-all duration-300 ${
                      achievement.earned
                        ? 'bg-slate-800/50 border-cyan-500/50 cursor-pointer hover:border-cyan-500'
                        : 'bg-slate-800/30 border-slate-700 opacity-50'
                    }`}
                  >
                    <div className="text-4xl mb-3">{achievement.icon}</div>
                    <h3 className={`font-bold mb-1 ${achievement.earned ? 'text-white' : 'text-slate-500'}`}>
                      {achievement.title}
                    </h3>
                    <p className={`text-xs ${achievement.earned ? 'text-slate-400' : 'text-slate-600'}`}>
                      {achievement.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
            <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
              <h2 className="text-2xl font-bold text-white mb-6">Learning Progress</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 font-medium">Product Discovery</span>
                    <span className="text-cyan-400 font-semibold">100%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 font-medium">Product Strategy</span>
                    <span className="text-cyan-400 font-semibold">60%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 font-medium">User Research</span>
                    <span className="text-cyan-400 font-semibold">30%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
