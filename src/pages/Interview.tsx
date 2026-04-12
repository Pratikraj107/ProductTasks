import { MessageSquare, ArrowRight, Mic, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { InterviewQuestion } from '../lib/database.types';
import MockInterviewModal from '../components/MockInterviewModal';
import UpgradeModal from '../components/UpgradeModal';
import { useInterviewUsage } from '../hooks/useInterviewUsage';
import SEOHead from '../components/SEOHead';

interface ParsedQuestion {
  question: string;
  answers: string[];
  questionId: number;
  questionIndex: number;
  savedAnswer?: string | null;
}

interface CategoryData {
  category: string;
  gradient: string;
  items: ParsedQuestion[];
}

interface MockInterviewState {
  isOpen: boolean;
  question: string;
  questionId: number;
  questionIndex: number;
}

interface InterviewProps {
  onNavigateToCategory?: (category: string) => void;
}

export default function Interview({ onNavigateToCategory }: InterviewProps) {
  const { user } = useAuth();
  const { usageStatus, checkUsage, incrementUsage, fetchUsageStatus } = useInterviewUsage();
  const [questions, setQuestions] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [answersMap, setAnswersMap] = useState<Map<string, string>>(new Map());
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [mockInterviewState, setMockInterviewState] = useState<MockInterviewState>({
    isOpen: false,
    question: '',
    questionId: 0,
    questionIndex: 0
  });
  const [isOpeningInterview, setIsOpeningInterview] = useState(false);

  const seo = (
    <SEOHead
      title="AI Mock Interview Practice — Speak & Get Instant PM Feedback | ProductTasks"
      description="Practice PM interview questions with AI feedback on clarity, structure, and product sense. Start mock interviews, track usage, and improve faster."
      canonical="https://producttasks.com/dashboard/interview"
      keywords={['AI mock interview', 'PM interview questions', 'product management practice']}
      structuredData={{
        '@context': 'https://schema.org',
        '@type': 'Course',
        'name': 'Product Management Interview Question Bank',
        'description': 'Browse 600+ PM interview questions by category and practice with AI-powered mock interviews.',
        'provider': {
          '@type': 'Organization',
          'name': 'ProductTasks'
        }
      }}
    />
  );

  const categoryGradients = {
    'Product Design': 'from-blue-500 to-cyan-500',
    'Product Strategy': 'from-green-500 to-emerald-500',
    'Metrics & Analytics': 'from-purple-500 to-violet-500',
    'Estimation': 'from-orange-500 to-amber-500',
    'Behavioral': 'from-pink-500 to-rose-500',
    'Technical': 'from-indigo-500 to-purple-500',
    'Default': 'from-slate-500 to-gray-500'
  };

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const { data, error } = await supabase
          .from('interview_questions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching interview questions:', error);
        } else {
          // Parse and organize questions by topic
          const organizedQuestions = organizeQuestionsByTopic(data || []);
          setQuestions(organizedQuestions);
        }
      } catch (error) {
        console.error('Error fetching interview questions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  // Fetch answers for questions when they change
  useEffect(() => {
    const fetchAnswers = async () => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const newAnswersMap = new Map<string, string>();

      for (const category of questions) {
        for (const item of category.items) {
          const key = `${item.questionId}_${item.questionIndex}`;
          try {
            const response = await fetch(`${API_BASE_URL}/api/answers/${item.questionId}/${item.questionIndex}`);
            if (response.ok) {
              const data = await response.json();
              if (data.exists && data.answer) {
                newAnswersMap.set(key, data.answer);
              }
            }
          } catch (error) {
            // Silently fail - answers are optional
          }
        }
      }

      setAnswersMap(newAnswersMap);
    };

    if (questions.length > 0) {
      fetchAnswers();
    }
  }, [questions]);

  const organizeQuestionsByTopic = (rawQuestions: InterviewQuestion[]): CategoryData[] => {
    const topicMap = new Map<string, ParsedQuestion[]>();

    rawQuestions.forEach(item => {
      if (!item.topic || !item.questions) return;

      const topic = item.topic;
      const questionsList = parseQuestions(item.questions);
      const existingAnswers = item.answer || [];

      // Match questions with answers
      const parsedItems: ParsedQuestion[] = questionsList.map((question, index) => ({
        question: question.trim(),
        answers: existingAnswers,
        questionId: item.id,
        questionIndex: index
      }));

      if (topicMap.has(topic)) {
        topicMap.get(topic)!.push(...parsedItems);
      } else {
        topicMap.set(topic, parsedItems);
      }
    });

    // Convert to array format
    return Array.from(topicMap.entries()).map(([topic, items]) => ({
      category: topic,
      gradient: categoryGradients[topic as keyof typeof categoryGradients] || categoryGradients.Default,
      items
    }));
  };

  const parseQuestions = (questionsText: string): string[] => {
    // Split by common delimiters and clean up
    return questionsText
      .split(/[;\n\r]+/)
      .map(q => q.trim())
      .filter(q => q.length > 0);
  };

  const openMockInterview = async (question: string, questionId: number, questionIndex: number) => {
    if (!user) {
      setUsageError('Please sign in to use mock interviews');
      return;
    }

    // Prevent multiple simultaneous calls
    if (isOpeningInterview) {
      return;
    }

    setIsOpeningInterview(true);
    setUsageError(null);

    // Open modal immediately
    setMockInterviewState({
      isOpen: true,
      question,
      questionId,
      questionIndex
    });

    // Check usage in the background (non-blocking)
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Usage check timeout')), 3000)
      );
      
      const usageCheck = await Promise.race([
        checkUsage(),
        timeoutPromise
      ]) as Awaited<ReturnType<typeof checkUsage>>;

      if (usageCheck && !usageCheck.can_proceed) {
        // Close modal and show upgrade modal if usage limit reached
        setMockInterviewState({
          isOpen: false,
          question: '',
          questionId: 0,
          questionIndex: 0
        });
        setShowUpgradeModal(true);
      }
    } catch (err) {
      // Silently fail - allow user to proceed even if backend is unavailable
      console.warn('Usage check failed (backend may be unavailable):', err);
      // Modal is already open, so user can proceed
    } finally {
      setIsOpeningInterview(false);
    }
  };

  const closeMockInterview = () => {
    setMockInterviewState({
      isOpen: false,
      question: '',
      questionId: 0,
      questionIndex: 0
    });
  };

  const handleSeeMore = (category: string) => {
    if (onNavigateToCategory) {
      onNavigateToCategory(category);
    }
  };

  const totalQuestions = questions.reduce((sum, category) => sum + category.items.length, 0);

  if (loading) {
    return (
      <main className="p-8">
        {seo}
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading interview questions...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="p-8">
      {seo}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Interview Questions</h1>
            <p className="text-slate-400">Practice common PM interview questions with detailed answers</p>
          </div>
          {usageStatus && user && (
            <div className="text-right">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700">
                <div className="text-sm text-slate-400 mb-1">Monthly Usage</div>
                <div className="text-2xl font-bold text-white">
                  {usageStatus.current_usage} / {usageStatus.usage_limit}
                </div>
                <div className="text-xs text-slate-500 mt-1 capitalize">{usageStatus.plan_type} Plan</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usage Error Message */}
      {usageError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-400 font-semibold">{usageError}</p>
            {usageStatus && usageStatus.remaining === 0 && (
              <p className="text-red-300 text-sm mt-1">
                Upgrade to a paid plan to get 25 interviews per month.
              </p>
            )}
          </div>
          <button
            onClick={() => setUsageError(null)}
            className="text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-8 relative">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-20"></div>
        <div className="relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-3xl p-6 border border-blue-500/30">
          <div className="flex items-start space-x-4">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-3 rounded-xl">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-2">Interview Tip</h3>
              <p className="text-slate-300 text-sm">Always clarify the question, think out loud, consider trade-offs, and structure your answer using frameworks like CIRCLES, AARM, or STAR method.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {questions.length > 0 ? (
          questions.map((category, catIndex) => (
          <div key={catIndex} className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
            <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
              <div className="flex items-center space-x-3 mb-6">
                <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${category.gradient} text-white`}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">{category.category}</h2>
              </div>

              <div className="space-y-3">
                {category.items.slice(0, 3).map((item, itemIndex) => {
                  const answerKey = `${item.questionId}_${item.questionIndex}`;
                  const savedAnswer = answersMap.get(answerKey);
                  const isExpanded = expandedAnswers.has(answerKey);

                  return (
                    <div
                      key={itemIndex}
                      className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden transition-all duration-300"
                    >
                      <div className="p-5">
                        <p className="text-white font-semibold mb-4 pr-4">{item.question}</p>
                        <div className="flex items-center space-x-3 flex-wrap gap-2">
                          {user && (
                            <button
                              onClick={() => openMockInterview(item.question, item.questionId, item.questionIndex)}
                              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold transition-all"
                            >
                              <Mic className="w-4 h-4" />
                              <span>Try Now</span>
                            </button>
                          )}
                          {savedAnswer && (
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedAnswers);
                                if (isExpanded) {
                                  newExpanded.delete(answerKey);
                                } else {
                                  newExpanded.add(answerKey);
                                }
                                setExpandedAnswers(newExpanded);
                              }}
                              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition-all"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>{isExpanded ? 'Hide Answer' : 'View Answer'}</span>
                            </button>
                          )}
                        </div>
                        {isExpanded && savedAnswer && (
                          <div className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-green-500/30">
                            <h4 className="text-green-400 font-semibold mb-2">Ideal Answer:</h4>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{savedAnswer}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {category.items.length > 3 && (
                  <div className="pt-4">
                    <button
                      onClick={() => handleSeeMore(category.category)}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-semibold transition-all duration-300 border border-slate-600 hover:border-slate-500"
                    >
                      <span>See More Questions ({category.items.length - 3} more)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No interview questions available</h3>
            <p className="text-slate-500">Interview questions will appear here once they are added to the system.</p>
          </div>
        )}
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl blur opacity-10"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 text-center">
            <p className="text-4xl font-bold text-white mb-2">{totalQuestions}</p>
            <p className="text-slate-400 text-sm">Interview Questions</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl blur opacity-10"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 text-center">
            <p className="text-4xl font-bold text-white mb-2">{questions.length}</p>
            <p className="text-slate-400 text-sm">Categories</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl blur opacity-10"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 text-center">
            <p className="text-4xl font-bold text-white mb-2">∞</p>
            <p className="text-slate-400 text-sm">Practice Opportunities</p>
          </div>
        </div>
      </div>

      {/* Mock Interview Modal */}
      {mockInterviewState.isOpen && (
        <MockInterviewModal
          question={mockInterviewState.question}
          questionId={mockInterviewState.questionId}
          questionIndex={mockInterviewState.questionIndex}
          onClose={closeMockInterview}
          onInterviewComplete={async () => {
            await incrementUsage();
            await fetchUsageStatus();
          }}
        />
      )}

      {/* Upgrade Modal */}
      {usageStatus && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            setShowUpgradeModal(false);
            // Navigate to pricing section on home page
            window.location.href = '/#pricing';
          }}
          currentUsage={usageStatus.current_usage}
          usageLimit={usageStatus.usage_limit}
        />
      )}
    </div>
  );
}
