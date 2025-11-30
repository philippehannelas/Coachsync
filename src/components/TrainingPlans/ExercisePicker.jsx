import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Dumbbell, Filter, Edit2, Trash2 } from 'lucide-react';
import { getExerciseTemplates, getExerciseCategories, deleteExerciseTemplate } from '../../services/exerciseTemplateApi';
import CustomExerciseForm from './CustomExerciseForm';
import ExerciseVideoPlayer from './ExerciseVideoPlayer';

const ExercisePicker = ({ isOpen, onClose, onSelectExercise }) => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState({
    muscle_groups: [],
    categories: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);

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

  // Fetch exercises when modal opens or filters change
  useEffect(() => {
    if (isOpen) {
      fetchExercises();
    }
  }, [isOpen, selectedMuscleGroup, selectedCategory]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (selectedMuscleGroup) filters.muscle_group = selectedMuscleGroup;
      if (selectedCategory) filters.category = selectedCategory;
      
      const data = await getExerciseTemplates(filters);
      setExercises(data.exercises || []);
      setFilteredExercises(data.exercises || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter exercises by search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredExercises(filtered);
    } else {
      setFilteredExercises(exercises);
    }
  }, [searchTerm, exercises]);

  // Group exercises by muscle group
  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    const group = exercise.muscle_group;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(exercise);
    return acc;
  }, {});

  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise);
  };

  const handleAddExercise = () => {
    if (selectedExercise) {
      onSelectExercise({
        name: selectedExercise.name,
        sets: selectedExercise.default_sets,
        reps: selectedExercise.default_reps,
        rest_seconds: selectedExercise.default_rest_seconds,
        tempo: selectedExercise.default_tempo,
        instructions: selectedExercise.instructions,
        notes: ''
      });
      setSelectedExercise(null);
      setSearchTerm('');
      onClose();
    }
  };

  const clearFilters = () => {
    setSelectedMuscleGroup('');
    setSelectedCategory('');
    setSearchTerm('');
  };

  const handleCreateCustomExercise = () => {
    setEditingExercise(null);
    setShowCustomForm(true);
  };

  const handleEditExercise = (exercise, e) => {
    e.stopPropagation();
    setEditingExercise(exercise);
    setShowCustomForm(true);
  };

  const handleDeleteExercise = async (exercise, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${exercise.name}"?`)) {
      return;
    }
    try {
      await deleteExerciseTemplate(exercise.id);
      // Refresh exercise list
      fetchExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      alert('Failed to delete exercise. Please try again.');
    }
  };

  const handleSaveCustomExercise = () => {
    // Refresh exercise list after creating/updating
    fetchExercises();
    setShowCustomForm(false);
    setEditingExercise(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold">Exercise Library</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateCustomExercise}
              className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Custom</span>
              <span className="sm:hidden">New</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 sm:p-6 border-b space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                showFilters ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <select
                value={selectedMuscleGroup}
                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Muscle Groups</option>
                {categories.muscle_groups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {(selectedMuscleGroup || selectedCategory) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading exercises...</div>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Dumbbell className="w-12 h-12 mb-3 opacity-50" />
              <p>No exercises found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedExercises).map(([muscleGroup, groupExercises]) => (
                <div key={muscleGroup}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 sticky top-0 bg-white py-2">
                    {muscleGroup}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        onClick={() => handleSelectExercise(exercise)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedExercise?.id === exercise.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        {/* Video Player */}
                        {exercise.video_url && (
                          <div className="mb-3">
                            <ExerciseVideoPlayer
                              videoUrl={exercise.video_url}
                              exerciseName={exercise.name}
                              autoPlay={false}
                              showControls={true}
                              className="h-48 w-full"
                            />
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                            {exercise.is_custom && (
                              <span className="text-xs text-green-600 font-medium">Custom Exercise</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                              {exercise.category}
                            </span>
                            {exercise.is_custom && (
                              <>
                                <button
                                  onClick={(e) => handleEditExercise(exercise, e)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit exercise"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteExercise(exercise, e)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete exercise"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Default:</span> {exercise.default_sets} sets × {exercise.default_reps} reps
                          </p>
                          {exercise.equipment && (
                            <p>
                              <span className="font-medium">Equipment:</span> {exercise.equipment}
                            </p>
                          )}
                        </div>

                        {selectedExercise?.id === exercise.id && exercise.instructions && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Instructions:</span> {exercise.instructions}
                            </p>
                            {exercise.tips && (
                              <p className="text-sm text-gray-700 mt-2">
                                <span className="font-medium">Tips:</span> {exercise.tips}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            {selectedExercise ? (
              <span className="font-medium text-blue-600">
                Selected: {selectedExercise.name}
              </span>
            ) : (
              <span>Select an exercise to add to your training plan</span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddExercise}
              disabled={!selectedExercise}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                selectedExercise
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Exercise
            </button>
          </div>
        </div>
      </div>

      {/* Custom Exercise Form Modal */}
      <CustomExerciseForm
        isOpen={showCustomForm}
        onClose={() => {
          setShowCustomForm(false);
          setEditingExercise(null);
        }}
        onSave={handleSaveCustomExercise}
        editExercise={editingExercise}
      />
    </div>
  );
};

export default ExercisePicker;
