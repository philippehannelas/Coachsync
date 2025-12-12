import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react';
import CoachSelector from '../CoachAssignment/CoachSelector';  // FIXED: Direct import instead of named export
import { coachConnectionsApi } from '../../services/coachConnectionsApi.js';  // FIXED: Added .js extension

/**
 * Modal for adding a coach to your team (sending connection request)
 * @param {Object} props
 * @param {Function} props.onClose - Close modal callback
 * @param {Function} props.onSuccess - Success callback
 */
const AddCoachModal = ({ onClose, onSuccess }) => {
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCoach) {
      setError('Please select a coach');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await coachConnectionsApi.sendConnectionRequest({
        receiver_coach_id: selectedCoach.id,
        request_message: message
      });
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send connection request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Coach to Your Team</h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="success-message">
            <CheckCircle size={48} color="#10B981" />
            <p>Connection request sent successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Coach</label>
              <CoachSelector
                onSelect={setSelectedCoach}
                selectedCoach={selectedCoach}
                placeholder="Search for a coach by name or email..."
              />
            </div>

            <div className="form-group">
              <label>Message (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself or explain why you'd like to connect..."
                rows={4}
                maxLength={500}
              />
              <small>{message.length}/500 characters</small>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !selectedCoach}
              >
                <Send size={18} />
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #E5E7EB;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #6B7280;
          transition: color 0.2s;
        }

        .modal-close:hover {
          color: #111827;
        }

        form {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
        }

        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
        }

        .form-group textarea:focus {
          outline: none;
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group small {
          display: block;
          margin-top: 4px;
          color: #6B7280;
          font-size: 12px;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #FEE2E2;
          border: 1px solid #FCA5A5;
          border-radius: 8px;
          color: #991B1B;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .success-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px 20px;
          text-align: center;
        }

        .success-message p {
          font-size: 18px;
          font-weight: 500;
          color: #059669;
          margin: 0;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-secondary,
        .btn-primary {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
        }

        .btn-secondary {
          background: #F3F4F6;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #E5E7EB;
        }

        .btn-primary {
          background: #3B82F6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563EB;
        }

        .btn-primary:disabled,
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default AddCoachModal;
