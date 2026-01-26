import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Link,
  MessageSquare,
  Users,
  User,
  LogOut,
  Rocket,
  Moon,
  Sun,
  Wrench,
  FileText,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useInterviewUsage } from '../hooks/useInterviewUsage';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isCollapsed?: boolean;
  onExternalNavigate?: (path: string) => void;
}

export default function Sidebar({ currentPage, onNavigate, isCollapsed = false, onExternalNavigate }: SidebarProps) {
  const { signOut, user } = useAuth();
  const { usageStatus } = useInterviewUsage();
  // const { isDark, toggleTheme } = useTheme();
  const isFreeUser = !usageStatus || usageStatus.plan_type === 'free';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5" /> },
    { id: 'topics', label: 'Topics', icon: <BookOpen className="w-4 h-4 md:w-5 md:h-5" /> },
    { id: 'tasks', label: 'Roadmap', icon: <CheckSquare className="w-4 h-4 md:w-5 md:h-5" /> },
    { id: 'interview', label: 'Mock Interview', icon: <MessageSquare className="w-4 h-4 md:w-5 md:h-5" /> },
    // { id: 'tools', label: 'Tools', icon: <Wrench className="w-4 h-4 md:w-5 md:h-5" /> },
    { id: 'resources', label: 'Product Resources', icon: <Link className="w-4 h-4 md:w-5 md:h-5" /> },

    // { id: 'resume', label: 'Resume', icon: <FileText className="w-4 h-4 md:w-5 md:h-5" /> },
    { id: 'community', label: 'Join Community', icon: <Users className="w-4 h-4 md:w-5 md:h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4 md:w-5 md:h-5" /> },
  ];

  return (
    <div className={`
      ${isCollapsed ? 'w-0' : 'w-64'} 
      h-screen bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 overflow-hidden
    `}>
      {!isCollapsed && (
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-1.5 md:p-2 rounded-lg">
                <Rocket className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
            </div>
            <span className="text-base md:text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ProductTasks
            </span>
          </div>
        </div>
      )}

      {!isCollapsed && (
        <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto hide-scrollbar-desktop min-h-0">
          {/* <button
            onClick={toggleTheme}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200 mb-2"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button> */}
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center space-x-3 px-3 md:px-4 py-3 rounded-lg transition-all duration-200 ${
                currentPage === item.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              {item.icon}
              <span className="font-medium text-base">{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {!isCollapsed && (
        <div className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white/90 dark:bg-slate-900/80">
          <div className="mb-3 md:mb-4 px-3 md:px-4 py-2 md:py-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-600 dark:text-slate-500 mb-1">Signed in as</p>
            <p className="text-sm text-slate-900 dark:text-white truncate">{user?.email}</p>
            {usageStatus && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">
                {usageStatus.plan_type} Plan
              </p>
            )}
          </div>
          
          {isFreeUser && (
            <button
              onClick={() => {
                if (onExternalNavigate) {
                  onExternalNavigate('/');
                  // Set hash after navigation completes
                  setTimeout(() => {
                    window.location.hash = 'pricing';
                  }, 200);
                } else {
                  window.location.href = '/#pricing';
                }
              }}
              className="w-full mb-3 flex items-center justify-center space-x-2 px-3 md:px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-base hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg"
            >
              <Zap className="w-4 h-4" />
              <span>Upgrade to Pro</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-3 md:px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-base">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
