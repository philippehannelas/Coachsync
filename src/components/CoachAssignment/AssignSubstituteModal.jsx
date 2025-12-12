import React, { useState } from 'react';
import { X, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { coachAssignmentApi } from '../../services/coachAssignmentApi';
import CoachSelector from './CoachSelector';

/**
 * Modal for assigning substitute coach to customers
 * @param {Object} props
 * @param {Array} props.customers - List of customers to assign (pre-selected)
 * @param {Function} props.onClose - Close modal callback
 * @param {Function} props.onSuccess - Success callback
 */
const AssignSubstituteModal = ({ customers = [], onClose, onSuccess }) => {
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [noEndDate, setNoEndDate] = useState(false);
  const [reason, setReason] = useState('');
  const [permissions, setPermissions] = useState({
    can_view_history: true,
    can_book_sessions: true,
    can_modify_plans: false,
    can_add_notes: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handlePermissionToggle = (permission) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!selectedCoach) {
      setError('Please select a substitute coach');
      setLoading(false);
      return;
    }

    if (!startDate) {
      setError('Please select a start date');
      setLoading(false);
      return;
    }

    try {
      const response = await coachAssignmentApi.createAssignment({
        customer_ids: customers.map(c => c.id),
        substitute_coach_email: selectedCoach.email,
        start_date: startDate,
        end_date: noEndDate ? null : endDate,
        reason: reason || 'Temporary coverage',
        permissions
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess && onSuccess(response);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.error || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  // Get customer name helper
  const getCustomerName = (customer) => {
    return customer.name || 
           `${customer.user?.first_name || customer.first_name || ''} ${customer.user?.last_name || customer.last_name || ''}`.trim() || 
           'Unnamed Customer';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Assign Substitute Coach
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="text-green-600" size={20} />
              <p className="text-green-800">Assignment created successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="text-red-600" size={20} />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Customer(s) Being Assigned - Read Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigning {customers.length === 1 ? 'Client' : 'Clients'}
            </label>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              {customers.map(customer => (
                <div key={customer.id} className="flex items-center gap-3 mb-2 last:mb-0">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {(customer.user?.first_name || customer.first_name || 'U')[0]}
                    {(customer.user?.last_name || customer.last_name || '')[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getCustomerName(customer)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {customer.user?.email || customer.email || ''}
                    </p>
                  </div>
                  <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {customer.session_credits || 0} credits
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Substitute Coach Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Substitute Coach
            </label>
            <CoachSelector
              selectedCoach={selectedCoach}
              onSelect={setSelectedCoach}
              placeholder="Search for a coach by name or email..."
            />
            <p className="text-xs text-gray-500 mt-1">
              The substitute coach will receive a notification and must accept the assignment
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || today}
                  disabled={noEndDate}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={noEndDate}
                  onChange={(e) => setNoEndDate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600">No end date (indefinite)</span>
              </label>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Vacation, Medical leave, Conference"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permissions for Substitute Coach
            </label>
            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
              {Object.entries({
                can_view_history: 'View client history',
                can_book_sessions: 'Book sessions',
                can_modify_plans: 'Edit training plans',
                can_add_notes: 'Add session notes'
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions[key]}
                    onChange={() => handlePermissionToggle(key)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : success ? 'Created!' : 'Send Assignment Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignSubstituteModal;
