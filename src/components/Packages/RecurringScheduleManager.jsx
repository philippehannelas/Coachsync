import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://coachsync-pro.onrender.com';

const RecurringScheduleManager = ({ subscription }) => {
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '10:00',
    auto_book_enabled: true,
    book_weeks_ahead: 4
  });

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (subscription?.id) {
      fetchSchedules();
    }
  }, [subscription]);

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('coachsync_token');
      const response = await axios.get(
        `${API_URL}/api/packages/subscriptions/${subscription.id}/recurring-schedules`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSchedules(response.data.schedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const createSchedule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('coachsync_token');
      await axios.post(
        `${API_URL}/api/packages/subscriptions/${subscription.id}/recurring-schedules`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setShowForm(false);
      setFormData({
        day_of_week: 0,
        start_time: '09:00',
        end_time: '10:00',
        auto_book_enabled: true,
        book_weeks_ahead: 4
      });
      fetchSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create recurring schedule');
    }
  };

  const toggleSchedule = async (scheduleId, isActive) => {
    try {
      const token = localStorage.getItem('coachsync_token');
      await axios.put(
        `${API_URL}/api/packages/recurring-schedules/${scheduleId}`,
        { is_active: !isActive },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchSchedules();
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this recurring schedule?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('coachsync_token');
      await axios.delete(
        `${API_URL}/api/packages/recurring-schedules/${scheduleId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const generateBookings = async () => {
    try {
      const token = localStorage.getItem('coachsync_token');
      const response = await axios.post(
        `${API_URL}/api/packages/recurring-schedules/generate-bookings`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert(response.data.message);
    } catch (error) {
      console.error('Error generating bookings:', error);
      alert('Failed to generate bookings');
    }
  };

  return (
    <div className="recurring-schedule-manager">
      <div className="header">
        <h3>Recurring Schedule</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Add Schedule'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createSchedule} className="schedule-form">
          <div className="form-group">
            <label>Day of Week</label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
              required
            >
              {dayNames.map((day, index) => (
                <option key={index} value={index}>{day}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Book Weeks Ahead</label>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.book_weeks_ahead}
              onChange={(e) => setFormData({ ...formData, book_weeks_ahead: parseInt(e.target.value) })}
              required
            />
            <small>Automatically create bookings this many weeks in advance</small>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.auto_book_enabled}
                onChange={(e) => setFormData({ ...formData, auto_book_enabled: e.target.checked })}
              />
              Enable automatic booking
            </label>
          </div>

          <button type="submit" className="btn btn-success">Create Schedule</button>
        </form>
      )}

      <div className="schedules-list">
        {schedules.length === 0 ? (
          <p className="text-muted">No recurring schedules yet. Create one to automatically book sessions.</p>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule.id} className={`schedule-card ${!schedule.is_active ? 'inactive' : ''}`}>
              <div className="schedule-info">
                <h4>{dayNames[schedule.day_of_week]}</h4>
                <p>{schedule.start_time} - {schedule.end_time}</p>
                <small>Books {schedule.book_weeks_ahead} weeks ahead</small>
              </div>
              
              <div className="schedule-actions">
                <button
                  onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                  className={`btn btn-sm ${schedule.is_active ? 'btn-warning' : 'btn-success'}`}
                >
                  {schedule.is_active ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={() => deleteSchedule(schedule.id)}
                  className="btn btn-sm btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {schedules.length > 0 && (
        <div className="actions">
          <button onClick={generateBookings} className="btn btn-secondary">
            Generate Bookings Now
          </button>
          <small className="text-muted">
            Manually trigger booking generation (normally runs automatically daily)
          </small>
        </div>
      )}

      <style jsx>{`
        .recurring-schedule-manager {
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .schedule-form {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .form-group small {
          display: block;
          margin-top: 5px;
          color: #666;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .schedules-list {
          margin-top: 20px;
        }

        .schedule-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 10px;
        }

        .schedule-card.inactive {
          opacity: 0.6;
          background: #f5f5f5;
        }

        .schedule-info h4 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .schedule-info p {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        .schedule-info small {
          color: #999;
          font-size: 12px;
        }

        .schedule-actions {
          display: flex;
          gap: 10px;
        }

        .actions {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
        }

        .actions small {
          display: block;
          margin-top: 10px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-primary {
          background: #0066FF;
          color: white;
        }

        .btn-success {
          background: #28a745;
          color: white;
        }

        .btn-warning {
          background: #ffc107;
          color: #333;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-sm {
          padding: 5px 10px;
          font-size: 12px;
        }

        .text-muted {
          color: #999;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default RecurringScheduleManager;
