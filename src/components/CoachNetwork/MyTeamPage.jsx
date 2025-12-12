import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { coachConnectionsApi } from '../../services/coachConnectionsApi';
import TeamMemberCard from './TeamMemberCard';
import ConnectionRequestCard from './ConnectionRequestCard';
import AddCoachModal from './AddCoachModal';

/**
 * My Team page - Manage coach connections and network
 */
const MyTeamPage = () => {
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load accepted connections
      const connectionsData = await coachConnectionsApi.getConnections('accepted');
      setConnections(connectionsData.connections || []);

      // Load pending requests
      const pendingData = await coachConnectionsApi.getPendingRequests();
      setPendingRequests(pendingData.pending_requests || []);

      // Load stats
      const statsData = await coachConnectionsApi.getNetworkStats();
      setStats(statsData);
    } catch (err) {
      setError(err.error || 'Failed to load team data');
      console.error('Error loading team:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    // Remove from pending and reload connections
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    await loadData();
  };

  const handleDeclineRequest = async (requestId) => {
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleRemoveConnection = async (connectionId) => {
    if (!confirm('Are you sure you want to remove this connection?')) {
      return;
    }

    try {
      await coachConnectionsApi.removeConnection(connectionId);
      setConnections(prev => prev.filter(c => c.id !== connectionId));
    } catch (err) {
      alert(err.error || 'Failed to remove connection');
    }
  };

  const handleUpdateNotes = async (connectionId, notes, tags) => {
    try {
      await coachConnectionsApi.updateConnectionNotes(connectionId, notes, tags);
      // Update local state
      setConnections(prev => prev.map(c => 
        c.id === connectionId ? { ...c, notes, tags } : c
      ));
    } catch (err) {
      throw err;
    }
  };

  const handleAssign = (coach) => {
    // TODO: Open assignment modal with this coach pre-selected
    console.log('Assign to coach:', coach);
    alert('Assignment feature coming soon!');
  };

  const handleViewHistory = (connection) => {
    // TODO: Open assignment history modal
    console.log('View history for:', connection);
    alert('Assignment history feature coming soon!');
  };

  // Filter connections by search query
  const filteredConnections = connections.filter(conn => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const coach = conn.coach || {};
    return (
      coach.full_name?.toLowerCase().includes(query) ||
      coach.email?.toLowerCase().includes(query) ||
      conn.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading your team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Team</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your professional network
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus size={20} />
              <span className="font-medium">Add Coach</span>
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-blue-600">{stats.total_connections}</p>
                <p className="text-xs text-gray-600">Team Members</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-600">{stats.assignments_given}</p>
                <p className="text-xs text-gray-600">Assignments Given</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-purple-600">{stats.assignments_received}</p>
                <p className="text-xs text-gray-600">Assignments Received</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <div className="flex-1">
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={loadData}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users size={20} />
              Pending Requests ({pendingRequests.length})
            </h2>
            <div className="space-y-3">
              {pendingRequests.map(request => (
                <ConnectionRequestCard
                  key={request.id}
                  request={request}
                  onAccept={handleAcceptRequest}
                  onDecline={handleDeclineRequest}
                />
              ))}
            </div>
          </div>
        )}

        {/* Team Members */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users size={20} />
              Team Members ({connections.length})
            </h2>
          </div>

          {/* Search */}
          {connections.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or tags..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Team List */}
          {filteredConnections.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <Users size={48} className="text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No matches found' : 'No team members yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery 
                  ? 'Try a different search term'
                  : 'Start building your professional network by adding coaches'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus size={20} />
                  Add Your First Coach
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConnections.map(connection => (
                <TeamMemberCard
                  key={connection.id}
                  connection={connection}
                  onRemove={handleRemoveConnection}
                  onAssign={handleAssign}
                  onViewHistory={handleViewHistory}
                  onUpdateNotes={handleUpdateNotes}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Coach Modal */}
      {showAddModal && (
        <AddCoachModal
          onClose={() => setShowAddModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

export default MyTeamPage;
