import { useState, useEffect } from 'react';
import { Menu, X, LayoutDashboard, BookOpen, FileText, MessageSquare, Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminTopics from '../pages/admin/AdminTopics';
import AdminSubtopics from '../pages/admin/AdminSubtopics';
import AdminLessons from '../pages/admin/AdminLessons';
import AdminInterviewQuestions from '../pages/admin/AdminInterviewQuestions';

interface AdminLayoutProps {
  onNavigate?: (path: string) => void;
}

export default function AdminLayout({ onNavigate }: AdminLayoutProps) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { signOut, user } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'topics', label: 'Topics', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'subtopics', label: 'Subtopics', icon: <FileText className="w-5 h-5" /> },
    { id: 'lessons', label: 'Lessons/Content', icon: <FileText className="w-5 h-5" /> },
    { id: 'interview', label: 'Interview Questions', icon: <MessageSquare className="w-5 h-5" /> },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'topics':
        return <AdminTopics />;
      case 'subtopics':
        return <AdminSubtopics />;
      case 'lessons':
        return <AdminLessons />;
      case 'interview':
        return <AdminInterviewQuestions />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-slate-50 to-slate-50 dark:from-blue-900/20 dark:via-slate-950 dark:to-slate-950"></div>
      </div>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile 
          ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out' 
          : 'relative'
        }
        ${sidebarOpen 
          ? 'translate-x-0' 
          : isMobile 
            ? '-translate-x-full' 
            : 'translate-x-0'
        }
        ${!isMobile && !sidebarOpen ? 'w-0' : ''}
      `}>
        <div className={`
          ${sidebarOpen ? 'w-64' : 'w-0'} 
          h-screen bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 overflow-hidden
        `}>
          {sidebarOpen && (
            <>
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-75 animate-pulse"></div>
                      <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-lg">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Admin Panel
                    </span>
                  </div>
                  {isMobile && (
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('/');
                    } else {
                      window.location.href = '/';
                    }
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to App</span>
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      currentPage === item.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div className="mb-3 px-4 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-500 mb-1">Signed in as</p>
                  <p className="text-sm text-slate-900 dark:text-white truncate">{user?.email}</p>
                </div>
                <button
                  onClick={signOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/10 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto relative z-10">
        {/* Mobile header */}
        {isMobile && (
          <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              ) : (
                <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              )}
            </button>
          </div>
        )}

        {/* Desktop toggle button */}
        {!isMobile && (
          <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              ) : (
                <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              )}
            </button>
          </div>
        )}

        {renderPage()}
      </div>
    </div>
  );
}
