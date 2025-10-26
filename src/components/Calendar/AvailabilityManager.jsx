import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { availabilityApi } from './calendarApi';

/**
 * AvailabilityManager Component
 * Allows coaches to set their weekly availability schedule
 */
const AvailabilityManager = ({ isOpen, onClose, onUpdate }) => {
  const [availability, setAvailability] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00'
  });

  const daysOfWeek = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadAvailability();
    }
  }, [isOpen]);

  const loadAvailability = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await availabilityApi.getCoachAvailability();
      setAvailability(data);
    } catch (err) {
      setError(err.message || 'Failed to load availability');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSlot = async () => {
    try {
      setError('');
      setIsSaving(true);

      // Validate times
      if (newSlot.start_time >= newSlot.end_time) {
        setError('Start time must be before end time');
        return;
      }

      await availabilityApi.createAvailability(newSlot);
      setSuccess('Availability slot added successfully!');
      setShowAddForm(false);
      setNewSlot({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00'
      });
      await loadAvailability();
      if (onUpdate) onUpdate();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add availability slot');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this availability slot?')) {
      return;
    }

    try {
      setError('');
      await availabilityApi.deleteAvailability(slotId);
      setSuccess('Availability slot deleted successfully!');
      await loadAvailability();
      if (onUpdate) onUpdate();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete availability slot');
    }
  };

  const handleToggleActive = async (slot) => {
    try {
      setError('');
      await availabilityApi.updateAvailability(slot.id, {
        is_active: !slot.is_active
      });
      setSuccess('Availability updated successfully!');
      await loadAvailability();
      if (onUpdate) onUpdate();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update availability');
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of ['00', '30']) {
        const time = `${String(hour).padStart(2, '0')}:${minute}`;
        options.push(time);
      }
    }
    return options;
  };

  const groupByDay = () => {
    const grouped = {};
    daysOfWeek.forEach(day => {
      grouped[day.value] = availability.filter(slot => slot.day_of_week === day.value);
    });
    return grouped;
  };

  const getDayLabel = (dayValue) => {
    return daysOfWeek.find(d => d.value === dayValue)?.label || 'Unknown';
  };

  if (!isOpen) return null;

  const groupedAvailability = groupByDay();
  const timeOptions = generateTimeOptions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Manage Availability</h2>
            <p className="text-gray-600 text-sm mt-1">Set your weekly schedule for training sessions</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Success Message */}
          {success && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg animate-fade-in">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading availability...</p>
            </div>
          ) : (
            <>
              {/* Add New Slot Button */}
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Availability Slot
                </button>
              )}

              {/* Add Slot Form */}
              {showAddForm && (
                <div className="mb-6 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h3 className="font-semibold text-gray-800 mb-3">New Availability Slot</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day of Week
                      </label>
                      <select
                        value={newSlot.day_of_week}
                        onChange={(e) => setNewSlot({ ...newSlot, day_of_week: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {daysOfWeek.map(day => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <select
                        value={newSlot.start_time}
                        onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <select
                        value={newSlot.end_time}
                        onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {timeOptions.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleAddSlot}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save Slot'}
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Availability Slots by Day */}
              <div className="space-y-4">
                {daysOfWeek.map(day => (
                  <div key={day.value} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      {day.label}
                    </h3>
                    
                    {groupedAvailability[day.value].length === 0 ? (
                      <p className="text-gray-500 text-sm">No availability set for this day</p>
                    ) : (
                      <div className="space-y-2">
                        {groupedAvailability[day.value].map(slot => (
                          <div
                            key={slot.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              slot.is_active
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleActive(slot)}
                                className={`w-10 h-6 rounded-full transition-colors relative ${
                                  slot.is_active ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                                    slot.is_active ? 'translate-x-5' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                              <span className="font-medium text-gray-800">
                                {slot.start_time} - {slot.end_time}
                              </span>
                              {!slot.is_active && (
                                <span className="text-xs text-gray-500">(Inactive)</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityManager;

