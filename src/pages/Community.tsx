import { Users, MessageCircle, Calendar, ExternalLink, Star } from 'lucide-react';
import SEOHead from '../components/SEOHead';

export default function Community() {
  const channels = [
    {
      name: 'General Discussion',
      members: 1250,
      icon: <MessageCircle className="w-5 h-5" />,
      description: 'Chat about all things product management',
      gradient: 'from-blue-500 to-cyan-500',
      online: 156
    },
    {
      name: 'Career Advice',
      members: 890,
      icon: <Users className="w-5 h-5" />,
      description: 'Get guidance on your PM career path',
      gradient: 'from-green-500 to-emerald-500',
      online: 89
    },
    {
      name: 'Interview Prep',
      members: 1100,
      icon: <Star className="w-5 h-5" />,
      description: 'Practice interviews and share tips',
      gradient: 'from-purple-500 to-violet-500',
      online: 134
    },
    {
      name: 'Product Teardowns',
      members: 756,
      icon: <MessageCircle className="w-5 h-5" />,
      description: 'Analyze and discuss popular products',
      gradient: 'from-orange-500 to-amber-500',
      online: 67
    },
  ];

  const upcomingEvents = [
    {
      title: 'Live Q&A with Senior PM at Google',
      date: 'Dec 15, 2025',
      time: '2:00 PM PST',
      attendees: 234
    },
    {
      title: 'Product Strategy Workshop',
      date: 'Dec 18, 2025',
      time: '10:00 AM PST',
      attendees: 156
    },
    {
      title: 'Mock Interview Practice Session',
      date: 'Dec 20, 2025',
      time: '6:00 PM PST',
      attendees: 89
    },
  ];

  const featuredMembers = [

  const seo = (
    <SEOHead
      title="Product Management Community — ProductTasks"
      description="Join the ProductTasks community to collaborate on PM interview prep, product insights, and career advice from peers and coaches."
      canonical="https://producttasks.com/dashboard/community"
      keywords={['product management community', 'PM peer network', 'career advice']}
    />
  );
    { name: 'Sarah Chen', role: 'Senior PM at Google', avatar: 'SC' },
    { name: 'Michael Torres', role: 'Product Lead at Meta', avatar: 'MT' },
    { name: 'Priya Patel', role: 'PM at Amazon', avatar: 'PP' },
    { name: 'James Wilson', role: 'Director of Product', avatar: 'JW' },
  ];

  return (
    <main className="p-8">
      {seo}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Join Community</h1>
        <p className="text-slate-400">Connect with PMs worldwide and grow together</p>
      </div>

      <div className="mb-8 relative">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-20"></div>
        <div className="relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/30">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-4xl font-black text-white mb-2">1,500+</p>
              <p className="text-slate-300">Active Members</p>
            </div>
            <div>
              <p className="text-4xl font-black text-white mb-2">50+</p>
              <p className="text-slate-300">Events per Month</p>
            </div>
            <div>
              <p className="text-4xl font-black text-white mb-2">24/7</p>
              <p className="text-slate-300">Community Support</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Community Channels</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {channels.map((channel, index) => (
            <div key={index} className="group relative">
              <div className={`absolute -inset-0.5 bg-gradient-to-br ${channel.gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300`}></div>
              <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${channel.gradient} text-white`}>
                    {channel.icon}
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-sm font-semibold">{channel.online} online</p>
                    <p className="text-slate-500 text-xs">{channel.members} members</p>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{channel.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{channel.description}</p>
                <a 
                  href="https://discord.gg/kMCjN45F" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-semibold"
                >
                  <span>Join Channel</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-6">Upcoming Events</h2>
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{event.date}</span>
                        </span>
                        <span>{event.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{event.attendees} attending</span>
                    <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all">
                      Register
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-6">Featured Members</h2>
            <div className="space-y-4">
              {featuredMembers.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer group"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur opacity-50"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{member.avatar}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold group-hover:text-cyan-400 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-slate-400 text-sm">{member.role}</p>
                  </div>
                  <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold transition-colors">
              View All Members
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 relative">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-600 to-rose-600 rounded-3xl blur opacity-20"></div>
        <div className="relative bg-gradient-to-br from-pink-500/10 to-rose-500/10 backdrop-blur-xl rounded-3xl p-8 border border-pink-500/30 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Join Our Discord Community</h3>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Connect with thousands of product managers, participate in live events, get career advice, and build your network.
          </p>
          <a 
            href="https://discord.gg/kMCjN45F" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-pink-700 hover:to-rose-700 transition-all inline-flex items-center space-x-2"
          >
            <Users className="w-5 h-5" />
            <span>Join Discord Server</span>
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
