import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import { createExerciseTemplate, updateExerciseTemplate, getExerciseCategories } from '../../services/exerciseTemplateApi';

const CustomExerciseForm = ({ isOpen, onClose, onSave, editExercise = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    muscle_group: '',
    category: '',
    equipment: '',
    default_sets: 3,
    default_reps: '10-12',
    default_rest_seconds: 60,
    default_tempo: '',
    instructions: '',
    tips: '',
    video_url: '',
    difficulty: 'intermediate'
  });

  const [categories, setCategories] = useState({
    muscle_groups: [],
    categories: [],
    difficulties: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getExerciseCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editExercise) {
      setFormData({
        name: editExercise.name || '',
        muscle_group: editExercise.muscle_group || '',
        category: editExercise.category || '',
        equipment: editExercise.equipment || '',
        default_sets: editExercise.default_sets || 3,
        default_reps: editExercise.default_reps || '10-12',
        default_rest_seconds: editExercise.default_rest_seconds || 60,
        default_tempo: editExercise.default_tempo || '',
        instructions: editExercise.instructions || '',
        tips: editExercise.tips || '',
        video_url: editExercise.video_url || '',
        difficulty: editExercise.difficulty || 'intermediate'
      });
    } else {
      // Reset form for new exercise
      setFormData({
        name: '',
        muscle_group: '',
        category: '',
        equipment: '',
        default_sets: 3,
        default_reps: '10-12',
        default_rest_seconds: 60,
        default_tempo: '',
        instructions: '',
        tips: '',
        video_url: '',
        difficulty: 'intermediate'
      });
    }
    setError('');
  }, [editExercise, isOpen]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Exercise name is required');
      return;
    }
    if (!formData.muscle_group) {
      setError('Please select a muscle group');
      return;
    }
    if (!formData.category) {
      setError('Please select a category');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let result;
      if (editExercise) {
        // Update existing exercise
        result = await updateExerciseTemplate(editExercise.id, formData);
      } else {
        // Create new exercise
        result = await createExerciseTemplate(formData);
      }
      
      onSave(result.exercise);
      onClose();
    } catch (error) {
      console.error('Error saving exercise:', error);
      setError(error.response?.data?.error || 'Failed to save exercise. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-xl sm:text-2xl font-bold">
            {editExercise ? 'Edit Custom Exercise' : 'Create Custom Exercise'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Exercise Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exercise Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Dumbbell Chest Press"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Muscle Group and Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Muscle Group *
                </label>
                <select
                  value={formData.muscle_group}
                  onChange={(e) => handleChange('muscle_group', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select muscle group</option>
                  {categories.muscle_groups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select category</option>
                  {categories.categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Equipment and Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment
                </label>
                <input
                  type="text"
                  value={formData.equipment}
                  onChange={(e) => handleChange('equipment', e.target.value)}
                  placeholder="e.g., Dumbbells, Bench"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Default Values */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Default Values</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Sets</label>
                  <input
                    type="number"
                    value={formData.default_sets}
                    onChange={(e) => handleChange('default_sets', parseInt(e.target.value))}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Reps</label>
                  <input
                    type="text"
                    value={formData.default_reps}
                    onChange={(e) => handleChange('default_reps', e.target.value)}
                    placeholder="10-12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Rest (sec)</label>
                  <input
                    type="number"
                    value={formData.default_rest_seconds}
                    onChange={(e) => handleChange('default_rest_seconds', parseInt(e.target.value))}
                    min="0"
                    max="300"
                    step="15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tempo</label>
                  <input
                    type="text"
                    value={formData.default_tempo}
                    onChange={(e) => handleChange('default_tempo', e.target.value)}
                    placeholder="3-1-1-0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => handleChange('instructions', e.target.value)}
                placeholder="Step-by-step instructions on how to perform this exercise..."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tips */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form Tips
              </label>
              <textarea
                value={formData.tips}
                onChange={(e) => handleChange('tips', e.target.value)}
                placeholder="Form tips, common mistakes to avoid, and coaching cues..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video URL (Optional)
              </label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => handleChange('video_url', e.target.value)}
                placeholder="https://example.com/exercise-video.mp4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add a direct link to an MP4 video file (10-15 seconds recommended)
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full sm:w-auto px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : editExercise ? 'Update Exercise' : 'Create Exercise'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomExerciseForm;
