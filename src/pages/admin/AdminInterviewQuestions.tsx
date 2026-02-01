import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { InterviewQuestion } from '../../lib/database.types';

export default function AdminInterviewQuestions() {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    questions: '',
    answer: [] as string[],
  });
  const [newAnswer, setNewAnswer] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert('Error fetching interview questions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase
        .from('interview_questions')
        .insert([{
          topic: formData.topic || null,
          questions: formData.questions || null,
          answer: formData.answer.length > 0 ? formData.answer : null,
        }]);

      if (error) throw error;
      await fetchQuestions();
      setShowForm(false);
      resetForm();
      alert('Interview question created successfully!');
    } catch (error: any) {
      console.error('Error creating question:', error);
      alert(`Error creating question: ${error.message}`);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      const { error } = await supabase
        .from('interview_questions')
        .update({
          topic: formData.topic || null,
          questions: formData.questions || null,
          answer: formData.answer.length > 0 ? formData.answer : null,
        })
        .eq('id', id);

      if (error) throw error;
      await fetchQuestions();
      setEditingId(null);
      resetForm();
      alert('Interview question updated successfully!');
    } catch (error: any) {
      console.error('Error updating question:', error);
      alert(`Error updating question: ${error.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this interview question?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('interview_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchQuestions();
      alert('Interview question deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting question:', error);
      alert(`Error deleting question: ${error.message}`);
    }
  };

  const startEdit = (question: InterviewQuestion) => {
    setEditingId(question.id);
    setFormData({
      topic: question.topic || '',
      questions: question.questions || '',
      answer: question.answer || [],
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      topic: '',
      questions: '',
      answer: [],
    });
    setEditingId(null);
    setShowForm(false);
    setNewAnswer('');
  };

  const addAnswer = () => {
    if (newAnswer.trim()) {
      setFormData({
        ...formData,
        answer: [...formData.answer, newAnswer.trim()],
      });
      setNewAnswer('');
    }
  };

  const removeAnswer = (index: number) => {
    setFormData({
      ...formData,
      answer: formData.answer.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Manage Interview Questions</h1>
          <p className="text-slate-600 dark:text-slate-400">Create, edit, and delete interview questions</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Question</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 mb-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            {editingId ? 'Edit Interview Question' : 'Create New Interview Question'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Topic/Category
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Product Strategy, User Research, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Question *
              </label>
              <textarea
                value={formData.questions}
                onChange={(e) => setFormData({ ...formData, questions: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={4}
                placeholder="Enter the interview question"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Answer Points
              </label>
              <div className="flex space-x-2 mb-2">
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && e.ctrlKey && addAnswer()}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  rows={2}
                  placeholder="Enter answer point (Ctrl+Enter to add)"
                />
                <button
                  onClick={addAnswer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {formData.answer.map((answer, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{answer}</span>
                    <button
                      onClick={() => removeAnswer(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <Save className="w-5 h-5" />
                <span>{editingId ? 'Update' : 'Create'}</span>
              </button>
              <button
                onClick={resetForm}
                className="flex items-center space-x-2 px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Topic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Question</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Answer Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No interview questions found. Create your first question!
                  </td>
                </tr>
              ) : (
                questions.map((question) => (
                  <tr key={question.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {question.topic || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white max-w-md">
                      {question.questions || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {question.answer?.length || 0} points
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {new Date(question.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => startEdit(question)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(question.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
