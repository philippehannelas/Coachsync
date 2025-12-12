import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Calendar, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { coachAssignmentApi } from '../../services/coachAssignmentApi';
import PendingAssignmentCard from './PendingAssignmentCard';

/**
 * Page for managing coach assignments (both given and received)
 */
const ManageAssignmentsPage = () => {
  const [activeTab, setActiveTab] = useState('received'); // 'given' or 'received'
  const [assignmentsGiven, setAssignmentsGiven] = useState([]);
  const [assignmentsReceived, setAssignmentsReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const [given, received] = await Promise.all([
        coachAssignmentApi.getAssignmentsGiven(),
        coachAssignmentApi.getAssignmentsReceived()
      ]);
      setAssignmentsGiven(given.assignments || []);
      setAssignmentsReceived(received.assignments || []);
    } catch (err) {
      setError(err.error || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCancelAssignment = async (assignmentId) => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      await coachAssignmentApi.cancelAssignment(assignmentId, cancelReason);
      setCancellingId(null);
      setCancelReason('');
      fetchAssignments();
    } catch (err) {
      alert(err.error || 'Failed to cancel assignment');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      declined: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const pendingReceived = assignmentsReceived.filter(a => a.status === 'pending');
  const otherReceived = assignmentsReceived.filter(a => a.status !== 'pending');

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Manage Assignments
        </h1>
        <p className="text-gray-600">
          View and manage temporary coach assignments
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'received'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <UserCheck size={18} />
            <span>Assignments for Me</span>
            {pendingReceived.length > 0 && (
              <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                {pendingReceived.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('given')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'given'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={18} />
            <span>My Assignments</span>
          </div>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-blue-600" size={32} />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Assignments Received Tab */}
          {activeTab === 'received' && (
            <div className="space-y-6">
              {/* Pending Assignments */}
              {pendingReceived.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Pending Requests ({pendingReceived.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {pendingReceived.map(assignment => (
                      <PendingAssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        onUpdate={fetchAssignments}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Assignments */}
              {otherReceived.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    All Assignments ({otherReceived.length})
                  </h2>
                  <div className="space-y-3">
                    {otherReceived.map(assignment => (
                      <div key={assignment.id} className="bg-white border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {assignment.customer?.name}
                              </h3>
                              {getStatusBadge(assignment.status)}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>From: {assignment.primary_coach?.name}</p>
                              <p className="flex items-center gap-2">
                                <Calendar size={14} />
                                {formatDate(assignment.start_date)} - {assignment.end_date ? formatDate(assignment.end_date) : 'Ongoing'}
                              </p>
                              {assignment.reason && <p>Reason: {assignment.reason}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {assignmentsReceived.length === 0 && (
                <div className="text-center py-12">
                  <UserCheck className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No assignments received yet</p>
                </div>
              )}
            </div>
          )}

          {/* Assignments Given Tab */}
          {activeTab === 'given' && (
            <div>
              {assignmentsGiven.length > 0 ? (
                <div className="space-y-3">
                  {assignmentsGiven.map(assignment => (
                    <div key={assignment.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {assignment.customer?.name}
                            </h3>
                            {getStatusBadge(assignment.status)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Substitute: {assignment.substitute_coach?.name}</p>
                            <p className="flex items-center gap-2">
                              <Calendar size={14} />
                              {formatDate(assignment.start_date)} - {assignment.end_date ? formatDate(assignment.end_date) : 'Ongoing'}
                            </p>
                            {assignment.reason && <p>Reason: {assignment.reason}</p>}
                          </div>
                        </div>
                        {(assignment.status === 'pending' || assignment.status === 'active') && (
                          <div>
                            {cancellingId === assignment.id ? (
                              <div className="flex flex-col gap-2">
                                <input
                                  type="text"
                                  placeholder="Reason for cancellation"
                                  value={cancelReason}
                                  onChange={(e) => setCancelReason(e.target.value)}
                                  className="px-3 py-1 text-sm border rounded"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleCancelAssignment(assignment.id)}
                                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCancellingId(null);
                                      setCancelReason('');
                                    }}
                                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setCancellingId(assignment.id)}
                                className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                              >
                                <XCircle size={14} />
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No assignments created yet</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManageAssignmentsPage;
