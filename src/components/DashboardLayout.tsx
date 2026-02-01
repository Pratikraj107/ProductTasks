import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import Topics from '../pages/Topics';
import TopicDetail from '../pages/TopicDetail';
import SubtopicLesson from '../pages/SubtopicLesson';
import Tasks from '../pages/Tasks';
import Resources from '../pages/Resources';
import Tools from '../pages/Tools';
import Interview from '../pages/Interview';
import CategoryDetail from '../pages/CategoryDetail';
import CommunicationLab from '../pages/CommunicationLab';
import Community from '../pages/Community';
import Profile from '../pages/Profile';
import Resume from '../pages/Resume';

interface DashboardLayoutProps {
  onNavigate?: (path: string) => void;
}

export default function DashboardLayout({ onNavigate }: DashboardLayoutProps) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // On mobile, sidebar should be closed by default
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

  const handleTopicClick = (topicId: string) => {
    setSelectedTopicId(topicId);
    setSelectedSubtopicId(null);
  };

  const handleSubtopicClick = (subtopicId: string) => {
    setSelectedSubtopicId(subtopicId);
  };

  const handleBackToTopics = () => {
    setSelectedTopicId(null);
    setSelectedSubtopicId(null);
  };

  const handleBackToTopicDetail = () => {
    setSelectedSubtopicId(null);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleBackToInterview = () => {
    setSelectedCategory(null);
  };

  const handleNavigateToSubtopic = async (subtopicId: string) => {
    try {
      // Fetch the topic ID for this subtopic
      const { data: subtopic, error } = await supabase
        .from('subtopics')
        .select('topic_id')
        .eq('id', subtopicId)
        .single();

      if (error) {
        console.error('Error fetching subtopic:', error);
        return;
      }

      if (subtopic) {
        setSelectedTopicId(subtopic.topic_id);
        setSelectedSubtopicId(subtopicId);
        setCurrentPage('topics'); // Switch to topics page to show the subtopic lesson
      }
    } catch (error) {
      console.error('Error navigating to subtopic:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedTopicId(null);
    setSelectedSubtopicId(null);
    setSelectedCategory(null);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'topics':
        if (selectedTopicId && selectedSubtopicId) {
          return (
            <SubtopicLesson
              subtopicId={selectedSubtopicId}
              onBack={handleBackToTopicDetail}
            />
          );
        }
        if (selectedTopicId) {
          return (
            <TopicDetail
              topicId={selectedTopicId}
              onBack={handleBackToTopics}
              onSubtopicClick={handleSubtopicClick}
            />
          );
        }
        return <Topics onTopicClick={handleTopicClick} />;
      case 'tasks':
        return <Tasks onNavigateToSubtopic={handleNavigateToSubtopic} />;
      case 'resources':
        return <Resources />;
      case 'tools':
        return <Tools />;
      case 'interview':
        if (selectedCategory) {
          return (
            <CategoryDetail
              category={selectedCategory}
              onBack={handleBackToInterview}
            />
          );
        }
        return <Interview onNavigateToCategory={handleCategoryClick} />;
      case 'communication':
        return <CommunicationLab />;
      case 'community':
        return <Community />;
      case 'resume':
        return <Resume />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-slate-50 to-slate-50 dark:from-blue-900/20 dark:via-slate-950 dark:to-slate-950"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-200/20 dark:bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/20 dark:bg-teal-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
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
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isCollapsed={!isMobile && !sidebarOpen}
          onExternalNavigate={onNavigate}
        />
      </div>

      {/* Main content */}
      <div className={`
        flex-1 overflow-y-auto relative z-10
        ${!isMobile && !sidebarOpen ? 'ml-0' : ''}
      `}>
        {/* Mobile header with toggle button */}
        {isMobile && (
          <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4">
            <button
              onClick={toggleSidebar}
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
              onClick={toggleSidebar}
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
