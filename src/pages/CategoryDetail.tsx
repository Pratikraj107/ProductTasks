import { MessageSquare, ArrowLeft, ChevronLeft, ChevronRight, Mic, AlertCircle } from 'lucide-react';
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
}

interface MockInterviewState {
  isOpen: boolean;
  question: string;
  questionId: number;
  questionIndex: number;
}

const QUESTIONS_PER_PAGE = 5;

interface CategoryDetailProps {
  category: string;
  onBack: () => void;
}

export default function CategoryDetail({ category, onBack }: CategoryDetailProps) {
  const { user } = useAuth();
  const { usageStatus, checkUsage, incrementUsage, fetchUsageStatus } = useInterviewUsage();
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
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
      title={`${category} Interview Questions — AI Practice & Feedback | ProductTasks`}
      description={`Practice ${category} PM interview questions with AI feedback, example answers, and category-specific mock interview guidance.`}
      canonical={`https://producttasks.com/dashboard/interview/${encodeURIComponent(category)}`}
      keywords={['PM interview questions', category, 'AI mock interview']}
      structuredData={{
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        'name': `${category} Interview Questions`,
        'educationalLevel': 'Intermediate',
        'learningResourceType': 'Practice question',
        'about': 'Product Management Interview'
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
    if (category) {
      fetchCategoryQuestions();
    }
  }, [category]);

  const fetchCategoryQuestions = async () => {
    if (!category) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('topic', category)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching category questions:', error);
      } else {
        const parsedQuestions = parseCategoryQuestions(data || []);
        setQuestions(parsedQuestions);
      }
    } catch (error) {
      console.error('Error fetching category questions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch answers for questions when they change
  useEffect(() => {
    const fetchAnswers = async () => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const newAnswersMap = new Map<string, string>();

      for (const item of questions) {
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

      setAnswersMap(newAnswersMap);
    };

    if (questions.length > 0) {
      fetchAnswers();
    }
  }, [questions]);

  const parseCategoryQuestions = (rawQuestions: InterviewQuestion[]): ParsedQuestion[] => {
    const allQuestions: ParsedQuestion[] = [];

    rawQuestions.forEach(item => {
      if (!item.questions) return;

      const questionsList = parseQuestions(item.questions);
      const existingAnswers = item.answer || [];

      const parsedItems: ParsedQuestion[] = questionsList.map((question, index) => ({
        question: question.trim(),
        answers: existingAnswers,
        questionId: item.id,
        questionIndex: index
      }));

      allQuestions.push(...parsedItems);
    });

    return allQuestions;
  };

  const parseQuestions = (questionsText: string): string[] => {
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

  const goBack = () => {
    onBack();
  };

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const endIndex = startIndex + QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const getGradient = () => {
    if (!category) return categoryGradients.Default;
    return categoryGradients[category as keyof typeof categoryGradients] || categoryGradients.Default;
  };

  if (loading) {
    return (
      <main className="p-8">
        {seo}
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="p-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-white mb-4">Category not found</h2>
          <button
            onClick={goBack}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="p-8">
      {seo}
      <div className="mb-8">
        <button
          onClick={goBack}
          className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Interview Questions</span>
        </button>
        
        <div className="flex items-center space-x-3 mb-2">
          <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${getGradient()} text-white`}>
            <MessageSquare className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black text-white">{category}</h1>
        </div>
        <p className="text-slate-400">All interview questions in this category</p>
      </div>

      <div className="mb-6 relative">
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
        {currentQuestions.length > 0 ? (
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl blur opacity-10"></div>
            <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800">
              <div className="space-y-4">
                {currentQuestions.map((item, itemIndex) => {
                  const answerKey = `${item.questionId}_${item.questionIndex}`;
                  const savedAnswer = answersMap.get(answerKey);
                  const isExpanded = expandedAnswers.has(answerKey);

                  return (
                    <div
                      key={itemIndex}
                      className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 transition-all duration-300 hover:border-cyan-500/50"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <p className="text-white font-semibold text-lg pr-4 flex-1">{item.question}</p>
                      </div>
                      
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
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No questions found</h3>
            <p className="text-slate-500">No questions available for this category.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-white transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page info */}
        {questions.length > 0 && (
          <div className="text-center text-slate-400 text-sm">
            Showing {startIndex + 1}-{Math.min(endIndex, questions.length)} of {questions.length} questions
          </div>
        )}
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
