import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Subtopic } from '../../lib/database.types';

interface Content {
  id: string;
  subtopic_id: string | null;
  content_heading: string | null;
  content_text: string;
  created_at: string;
  updated_at: string;
}

export default function AdminLessons() {
  const [contents, setContents] = useState<Content[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subtopic_id: '',
    content_heading: '',
    content_text: '',
  });

  useEffect(() => {
    fetchSubtopics();
    fetchContents();
  }, []);

  const fetchSubtopics = async () => {
    try {
      const { data, error } = await supabase
        .from('subtopics')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSubtopics(data || []);
    } catch (error) {
      console.error('Error fetching subtopics:', error);
    }
  };

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      alert('Error fetching content');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase
        .from('content')
        .insert([{
          subtopic_id: formData.subtopic_id || null,
          content_heading: formData.content_heading || null,
          content_text: formData.content_text,
        }]);

      if (error) throw error;
      await fetchContents();
      setShowForm(false);
      resetForm();
      alert('Content created successfully!');
    } catch (error: any) {
      console.error('Error creating content:', error);
      alert(`Error creating content: ${error.message}`);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content')
        .update({
          subtopic_id: formData.subtopic_id || null,
          content_heading: formData.content_heading || null,
          content_text: formData.content_text,
        })
        .eq('id', id);

      if (error) throw error;
      await fetchContents();
      setEditingId(null);
      resetForm();
      alert('Content updated successfully!');
    } catch (error: any) {
      console.error('Error updating content:', error);
      alert(`Error updating content: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchContents();
      alert('Content deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting content:', error);
      alert(`Error deleting content: ${error.message}`);
    }
  };

  const startEdit = (content: Content) => {
    setEditingId(content.id);
    setFormData({
      subtopic_id: content.subtopic_id || '',
      content_heading: content.content_heading || '',
      content_text: content.content_text,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      subtopic_id: subtopics[0]?.id || '',
      content_heading: '',
      content_text: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getSubtopicName = (subtopicId: string | null) => {
    if (!subtopicId) return 'No subtopic';
    return subtopics.find(s => s.id === subtopicId)?.title || 'Unknown';
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Manage Content</h1>
          <p className="text-slate-600 dark:text-slate-400">Create, edit, and delete content</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Content</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 mb-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            {editingId ? 'Edit Content' : 'Create New Content'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Subtopic
              </label>
              <select
                value={formData.subtopic_id}
                onChange={(e) => setFormData({ ...formData, subtopic_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a subtopic (optional)</option>
                {subtopics.map((subtopic) => (
                  <option key={subtopic.id} value={subtopic.id}>{subtopic.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Content Heading
              </label>
              <input
                type="text"
                value={formData.content_heading}
                onChange={(e) => setFormData({ ...formData, content_heading: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter content heading (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Content Text *
              </label>
              <textarea
                value={formData.content_text}
                onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={10}
                placeholder="Enter content text"
              />
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
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subtopic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Heading</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Content Preview</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {contents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No content found. Create your first content!
                  </td>
                </tr>
              ) : (
                contents.map((content) => (
                  <tr key={content.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {getSubtopicName(content.subtopic_id)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                      {content.content_heading || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-md">
                      <div className="truncate">{content.content_text.substring(0, 100)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {new Date(content.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => startEdit(content)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(content.id)}
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
