import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Save } from 'lucide-react';
import { availabilityApi } from '../../services/calendarApi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AvailabilityManager = ({ onClose, onSave }) => {
  const [availability, setAvailabilityState] = useState({});
  const [sessionDuration, setSessionDuration] = useState(60); // Default 60 minutes
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await availabilityApi.getCoachAvailability();
      
      // Convert API format to component format
      const formattedAvailability = {};
      data.forEach(slot => {
        if (!formattedAvailability[slot.day_of_week]) {
          formattedAvailability[slot.day_of_week] = [];
        }
        formattedAvailability[slot.day_of_week].push({
          start_time: slot.start_time,
          end_time: slot.end_time
        });
      });
      
      setAvailabilityState(formattedAvailability);
      
      // Get session duration from first slot if available
      if (data.length > 0 && data[0].session_duration) {
        setSessionDuration(data[0].session_duration);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load availability:', err);
      setError('Failed to load availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = (day) => {
    setAvailabilityState(prev => ({
      ...prev,
      [day]: [
        ...(prev[day] || []),
        { start_time: '09:00', end_time: '17:00' }
      ]
    }));
  };

  const removeTimeSlot = (day, index) => {
    setAvailabilityState(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (day, index, field, value) => {
    setAvailabilityState(prev => ({
      ...prev,
      [day]: prev[day].map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate session duration
      if (sessionDuration < 15 || sessionDuration > 240) {
        setError('Session duration must be between 15 and 240 minutes');
        setSaving(false);
        return;
      }

      // Convert to API format
      const slots = [];
      Object.entries(availability).forEach(([day, timeSlots]) => {
        timeSlots.forEach(slot => {
          slots.push({
            day_of_week: day,
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
      
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Failed to save availability:', err);
      setError('Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSessionDurationChange = (e) => {
    const value = e.target.value;
    // Allow empty string for editing
    if (value === '') {
      setSessionDuration('');
      return;
    }
    // Parse and validate
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setSessionDuration(numValue);
    }
  };

  const handleSessionDurationBlur = () => {
    // If empty or invalid, reset to default
    if (sessionDuration === '' || sessionDuration < 15) {
      setSessionDuration(60);
    } else if (sessionDuration > 240) {
      setSessionDuration(240);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Manage Availability</h2>
            <p className="text-gray-600 mt-1">Set your weekly recurring availability schedule</p>
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

        {/* Session Duration Setting */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Session Duration</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Set the default duration for each coaching session. This will be used when clients book appointments.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="15"
                max="240"
                step="5"
                value={sessionDuration}
                onChange={handleSessionDurationChange}
                onBlur={handleSessionDurationBlur}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-700 font-medium">minutes</span>
            </div>
            <div className="text-sm text-gray-500">
              (15-240 minutes)
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setSessionDuration(30)}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              30 min
            </button>
            <button
              onClick={() => setSessionDuration(45)}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              45 min
            </button>
            <button
              onClick={() => setSessionDuration(60)}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              60 min
            </button>
            <button
              onClick={() => setSessionDuration(90)}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              90 min
            </button>
            <button
              onClick={() => setSessionDuration(120)}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              120 min
            </button>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="space-y-6">
          {DAYS.map(day => (
            <div key={day} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{day}</h3>
                <button
                  onClick={() => addTimeSlot(day)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Time Slot
                </button>
              </div>

              {availability[day] && availability[day].length > 0 ? (
                <div className="space-y-2">
                  {availability[day].map((slot, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => updateTimeSlot(day, index, 'start_time', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-gray-600">to</span>
                        <input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) => updateTimeSlot(day, index, 'end_time', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => removeTimeSlot(day, index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

        {/* Footer */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Availability
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityManager;

