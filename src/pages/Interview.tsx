import { MessageSquare, ArrowRight, Mic } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { InterviewQuestion } from '../lib/database.types';
import MockInterviewModal from '../components/MockInterviewModal';

interface ParsedQuestion {
  question: string;
  answers: string[];
  questionId: number;
  questionIndex: number;
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
  const [questions, setQuestions] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockInterviewState, setMockInterviewState] = useState<MockInterviewState>({
    isOpen: false,
    question: '',
    questionId: 0,
    questionIndex: 0
  });

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

  const openMockInterview = (question: string, questionId: number, questionIndex: number) => {
    setMockInterviewState({
      isOpen: true,
      question,
      questionId,
      questionIndex
    });
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
      <div className="p-8">
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading interview questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Interview Questions</h1>
        <p className="text-slate-400">Practice common PM interview questions with detailed answers</p>
      </div>

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
                  return (
                    <div
                      key={itemIndex}
                      className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden transition-all duration-300"
                    >
                      <div className="p-5">
                        <p className="text-white font-semibold mb-4 pr-4">{item.question}</p>
                        {user && (
                          <button
                            onClick={() => openMockInterview(item.question, item.questionId, item.questionIndex)}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold transition-all"
                          >
                            <Mic className="w-4 h-4" />
                            <span>Try Now</span>
                          </button>
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
          onClose={closeMockInterview}
        />
      )}
    </div>
  );
}
