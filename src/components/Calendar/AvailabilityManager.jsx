import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Save, Calendar as CalendarIcon, Ban, Edit2 } from 'lucide-react';
import { availabilityApi } from '../../services/calendarApi';
import { dateSpecificApi } from '../../services/dateSpecificApi';

// Day configuration with indices matching backend (0=Monday, 6=Sunday)
const DAYS = [
  { name: 'Monday', index: 0 },
  { name: 'Tuesday', index: 1 },
  { name: 'Wednesday', index: 2 },
  { name: 'Thursday', index: 3 },
  { name: 'Friday', index: 4 },
  { name: 'Saturday', index: 5 },
  { name: 'Sunday', index: 6 }
];

const AvailabilityManager = ({ onClose, onSave }) => {
  // Tab state
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'special'
  
  // Weekly availability state
  const [availability, setAvailabilityState] = useState({});
  const [sessionDuration, setSessionDuration] = useState(60);
  
  // Date-specific availability state
  const [dateSpecific, setDateSpecific] = useState([]);
  const [showAddSpecialDate, setShowAddSpecialDate] = useState(false);
  const [specialDateForm, setSpecialDateForm] = useState({
    date: '',
    type: 'unavailable',
    start_time: '09:00',
    end_time: '17:00',
    reason: ''
  });
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    start_date: '',
    end_date: '',
    type: 'unavailable',
    reason: ''
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllAvailability();
  }, []);

  const loadAllAvailability = async () => {
    try {
      setLoading(true);
      
      // Load weekly availability
      const weeklyData = await availabilityApi.getCoachAvailability();
      const formattedAvailability = {};
      weeklyData.forEach(slot => {
        const dayIndex = slot.day_of_week;
        if (!formattedAvailability[dayIndex]) {
          formattedAvailability[dayIndex] = [];
        }
        formattedAvailability[dayIndex].push({
          start_time: slot.start_time,
          end_time: slot.end_time
        });
      });
      setAvailabilityState(formattedAvailability);
      
      if (weeklyData.length > 0 && weeklyData[0].session_duration) {
        setSessionDuration(weeklyData[0].session_duration);
      }
      
      // Load date-specific availability
      const dateSpecificData = await dateSpecificApi.getAll();
      setDateSpecific(dateSpecificData);
      
      setError(null);
    } catch (err) {
      console.error('Failed to load availability:', err);
      setError('Failed to load availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Weekly availability functions
  const addTimeSlot = (dayIndex) => {
    setAvailabilityState(prev => ({
      ...prev,
      [dayIndex]: [
        ...(prev[dayIndex] || []),
        { start_time: '09:00', end_time: '17:00' }
      ]
    }));
  };

  const removeTimeSlot = (dayIndex, slotIndex) => {
    setAvailabilityState(prev => ({
      ...prev,
      [dayIndex]: prev[dayIndex].filter((_, i) => i !== slotIndex)
    }));
  };

  const updateTimeSlot = (dayIndex, slotIndex, field, value) => {
    setAvailabilityState(prev => ({
      ...prev,
      [dayIndex]: prev[dayIndex].map((slot, i) => 
        i === slotIndex ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSaveWeekly = async () => {
    try {
      setSaving(true);
      setError(null);

      if (sessionDuration < 15 || sessionDuration > 240) {
        setError('Session duration must be between 15 and 240 minutes');
        setSaving(false);
        return;
      }

      const slots = [];
      Object.entries(availability).forEach(([dayIndex, timeSlots]) => {
        timeSlots.forEach(slot => {
          slots.push({
            day_of_week: parseInt(dayIndex),
            start_time: slot.start_time,
            end_time: slot.end_time,
            session_duration: sessionDuration
          });
        });
      });

      await availabilityApi.createAvailability(slots);
      
      if (onSave) {
        onSave();
      }
      
      setError(null);
      alert('Weekly availability saved successfully!');
    } catch (err) {
      console.error('Failed to save availability:', err);
      setError('Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Date-specific availability functions
  const handleAddSpecialDate = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!specialDateForm.date) {
        setError('Please select a date');
        setSaving(false);
        return;
      }

      await dateSpecificApi.create(specialDateForm);
      
      // Reload date-specific availability
      const dateSpecificData = await dateSpecificApi.getAll();
      setDateSpecific(dateSpecificData);
      
      // Reset form
      setSpecialDateForm({
        date: '',
        type: 'unavailable',
        start_time: '09:00',
        end_time: '17:00',
        reason: ''
      });
      setShowAddSpecialDate(false);
      
      setError(null);
      alert('Special date added successfully!');
    } catch (err) {
      console.error('Failed to add special date:', err);
      setError(err.message || 'Failed to add special date. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVacation = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!bulkForm.start_date || !bulkForm.end_date) {
        setError('Please select start and end dates');
        setSaving(false);
        return;
      }

      const result = await dateSpecificApi.createBulk(bulkForm);
      
      // Reload date-specific availability
      const dateSpecificData = await dateSpecificApi.getAll();
      setDateSpecific(dateSpecificData);
      
      // Reset form
      setBulkForm({
        start_date: '',
        end_date: '',
        type: 'unavailable',
        reason: ''
      });
      setShowBulkForm(false);
      
      setError(null);
      alert(`Vacation period added! ${result.message}`);
    } catch (err) {
      console.error('Failed to add vacation:', err);
      setError(err.message || 'Failed to add vacation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpecialDate = async (id) => {
    if (!confirm('Are you sure you want to delete this special date?')) {
      return;
    }

    try {
      setSaving(true);
      await dateSpecificApi.delete(id);
      
      // Reload date-specific availability
      const dateSpecificData = await dateSpecificApi.getAll();
      setDateSpecific(dateSpecificData);
      
      alert('Special date deleted successfully!');
    } catch (err) {
      console.error('Failed to delete special date:', err);
      setError(err.message || 'Failed to delete special date. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSessionDurationChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setSessionDuration('');
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setSessionDuration(numValue);
    }
  };

  const handleSessionDurationBlur = () => {
    if (sessionDuration === '' || sessionDuration < 15) {
      setSessionDuration(60);
    } else if (sessionDuration > 240) {
      setSessionDuration(240);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-4 sm:p-8 max-w-4xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 overflow-hidden">
      <div className="bg-white rounded-lg p-4 sm:p-8 w-[calc(100vw-16px)] sm:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Availability</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Set your schedule and special dates</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'weekly'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Weekly Schedule
          </button>
          <button
            onClick={() => setActiveTab('special')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'special'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <CalendarIcon className="w-4 h-4 inline mr-2" />
            Special Dates ({dateSpecific.length})
          </button>
        </div>

        {/* Weekly Schedule Tab */}
        {activeTab === 'weekly' && (
          <div>
            {/* Session Duration Setting */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Session Duration</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Set the default duration for each coaching session.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="15"
                    max="240"
                    step="5"
                    value={sessionDuration}
                    onChange={handleSessionDurationChange}
                    onBlur={handleSessionDurationBlur}
                    className="w-20 sm:w-24 px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-sm sm:text-base text-gray-700 font-medium">minutes</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-500">(15-240 min)</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[30, 45, 60, 90].map(duration => (
                  <button
                    key={duration}
                    onClick={() => setSessionDuration(duration)}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    {duration} min
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Schedule */}
            <div className="space-y-4 sm:space-y-6">
              {DAYS.map(day => (
                <div key={day.index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">{day.name}</h3>
                    <button
                      onClick={() => addTimeSlot(day.index)}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      Add Time Slot
                    </button>
                  </div>

                  {availability[day.index] && availability[day.index].length > 0 ? (
                    <div className="space-y-2">
                      {availability[day.index].map((slot, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 sm:p-3 rounded-lg">
                          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                            <input
                              type="time"
                              value={slot.start_time}
                              onChange={(e) => updateTimeSlot(day.index, index, 'start_time', e.target.value)}
                              className="px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-24 sm:w-auto"
                            />
                            <span className="text-gray-600 text-xs sm:text-base">to</span>
                            <input
                              type="time"
                              value={slot.end_time}
                              onChange={(e) => updateTimeSlot(day.index, index, 'end_time', e.target.value)}
                              className="px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-24 sm:w-auto"
                            />
                          </div>
                          <button
                            onClick={() => removeTimeSlot(day.index, index)}
                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No availability set for this day</p>
                  )}
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWeekly}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Weekly Schedule'}
              </button>
            </div>
          </div>
        )}

        {/* Special Dates Tab */}
        {activeTab === 'special' && (
          <div>
            {/* Add Buttons */}
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setShowAddSpecialDate(!showAddSpecialDate)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Special Date
              </button>
              <button
                onClick={() => setShowBulkForm(!showBulkForm)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <CalendarIcon className="w-4 h-4" />
                Add Vacation Period
              </button>
            </div>

            {/* Add Special Date Form */}
            {showAddSpecialDate && (
              <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Special Date</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={specialDateForm.date}
                      onChange={(e) => setSpecialDateForm({...specialDateForm, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={specialDateForm.type}
                      onChange={(e) => setSpecialDateForm({...specialDateForm, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="unavailable">Block Full Day</option>
                      <option value="available">Block Specific Hours</option>
                    </select>
                  </div>
                  {specialDateForm.type === 'available' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                        <input
                          type="time"
                          value={specialDateForm.start_time}
                          onChange={(e) => setSpecialDateForm({...specialDateForm, start_time: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                        <input
                          type="time"
                          value={specialDateForm.end_time}
                          onChange={(e) => setSpecialDateForm({...specialDateForm, end_time: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                    <input
                      type="text"
                      value={specialDateForm.reason}
                      onChange={(e) => setSpecialDateForm({...specialDateForm, reason: e.target.value})}
                      placeholder="e.g., Holiday, Personal day"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddSpecialDate}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      onClick={() => setShowAddSpecialDate(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Vacation Period Form */}
            {showBulkForm && (
              <div className="mb-6 p-6 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Vacation Period</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={bulkForm.start_date}
                        onChange={(e) => setBulkForm({...bulkForm, start_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={bulkForm.end_date}
                        onChange={(e) => setBulkForm({...bulkForm, end_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                    <input
                      type="text"
                      value={bulkForm.reason}
                      onChange={(e) => setBulkForm({...bulkForm, reason: e.target.value})}
                      placeholder="e.g., Summer Vacation, Conference"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddVacation}
                      disabled={saving}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Adding...' : 'Add Vacation Period'}
                    </button>
                    <button
                      onClick={() => setShowBulkForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Special Dates List */}
            <div className="space-y-3">
              {dateSpecific.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No special dates set</p>
                  <p className="text-sm">Add blocked dates or custom hours for specific days</p>
                </div>
              ) : (
                dateSpecific.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border-2 ${
                      item.type === 'unavailable'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {item.type === 'unavailable' ? (
                            <Ban className="w-5 h-5 text-red-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-green-600" />
                          )}
                          <span className="font-semibold text-gray-800">
                            {formatDate(item.date)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            item.type === 'unavailable'
                              ? 'bg-red-200 text-red-800'
                              : 'bg-green-200 text-green-800'
                          }`}>
                            {item.type === 'unavailable' ? 'Unavailable' : 'Available'}
                          </span>
                        </div>
                        {item.type === 'available' && (
                          <p className="text-sm text-gray-700 ml-7">
                            {item.start_time} - {item.end_time}
                          </p>
                        )}
                        {item.reason && (
                          <p className="text-sm text-gray-600 ml-7 italic">
                            {item.reason}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteSpecialDate(item.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityManager;

