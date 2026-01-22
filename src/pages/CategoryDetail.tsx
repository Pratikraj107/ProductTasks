import { MessageSquare, ChevronDown, ChevronUp, Plus, X, Save, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { InterviewQuestion } from '../lib/database.types';

interface ParsedQuestion {
  question: string;
  answers: string[];
  questionId: number;
  questionIndex: number;
}

interface AddAnswerState {
  isOpen: boolean;
  questionId: number;
  questionIndex: number;
  answer: string;
}

const QUESTIONS_PER_PAGE = 5;

interface CategoryDetailProps {
  category: string;
  onBack: () => void;
}

export default function CategoryDetail({ category, onBack }: CategoryDetailProps) {
  const { user } = useAuth();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [addAnswerState, setAddAnswerState] = useState<AddAnswerState>({
    isOpen: false,
    questionId: 0,
    questionIndex: 0,
    answer: ''
  });
  const [saving, setSaving] = useState(false);

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

  const openAddAnswer = (questionId: number, questionIndex: number) => {
    setAddAnswerState({
      isOpen: true,
      questionId,
      questionIndex,
      answer: ''
    });
  };

  const closeAddAnswer = () => {
    setAddAnswerState({
      isOpen: false,
      questionId: 0,
      questionIndex: 0,
      answer: ''
    });
  };

  const saveAnswer = async () => {
    if (!user || !addAnswerState.answer.trim()) return;

    setSaving(true);
    try {
      const currentQuestion = questions.find(item => item.questionId === addAnswerState.questionId);

      if (!currentQuestion) {
        console.error('Question not found');
        return;
      }

      const updatedAnswers = [...currentQuestion.answers, addAnswerState.answer.trim()];

      const { error } = await supabase
        .from('interview_questions')
        .update({ answer: updatedAnswers })
        .eq('id', addAnswerState.questionId);

      if (error) {
        console.error('Error saving answer:', error);
        return;
      }

      setQuestions(prevQuestions => 
        prevQuestions.map(item => 
          item.questionId === addAnswerState.questionId
            ? { ...item, answers: updatedAnswers }
            : item
        )
      );

      closeAddAnswer();
    } catch (error) {
      console.error('Error saving answer:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleQuestion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
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
    setExpandedIndex(null); // Close any expanded questions when changing pages
  };

  const getGradient = () => {
    if (!category) return categoryGradients.Default;
    return categoryGradients[category as keyof typeof categoryGradients] || categoryGradients.Default;
  };

  if (loading) {
    return (
      <div className="p-8">
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
    <div className="p-8">
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
              <div className="space-y-3">
                {currentQuestions.map((item, itemIndex) => {
                  const globalIndex = startIndex + itemIndex;
                  const isExpanded = expandedIndex === globalIndex;

                  return (
                    <div
                      key={itemIndex}
                      className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden transition-all duration-300"
                    >
                      <button
                        onClick={() => toggleQuestion(globalIndex)}
                        className="w-full flex items-center justify-between p-5 hover:bg-slate-800 transition-colors text-left"
                      >
                        <span className="text-white font-semibold pr-4">{item.question}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-2 border-t border-slate-700">
                          {item.answers.length > 0 ? (
                            <div className="space-y-4">
                              {item.answers.map((answer, answerIndex) => (
                                <div key={answerIndex} className="bg-slate-700/50 rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <span className="text-cyan-400 text-sm font-semibold">
                                      Answer {answerIndex + 1}
                                    </span>
                                  </div>
                                  <p className="text-slate-300 leading-relaxed">{answer}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                              <p className="text-slate-400 mb-4">No answers available yet</p>
                            </div>
                          )}
                          
                          {user && (
                            <div className="mt-4 pt-4 border-t border-slate-600">
                              <button
                                onClick={() => openAddAnswer(item.questionId, item.questionIndex)}
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold transition-all"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Add Answer</span>
                              </button>
                            </div>
                          )}
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

      {/* Add Answer Modal */}
      {addAnswerState.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Add Your Answer</h3>
                <button
                  onClick={closeAddAnswer}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  Your Answer
                </label>
                <textarea
                  value={addAnswerState.answer}
                  onChange={(e) => setAddAnswerState(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="Share your answer to this interview question..."
                  className="w-full h-32 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={closeAddAnswer}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAnswer}
                  disabled={!addAnswerState.answer.trim() || saving}
                  className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold transition-all disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Answer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
