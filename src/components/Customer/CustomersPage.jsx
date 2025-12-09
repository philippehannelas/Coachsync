import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, ArrowLeft } from 'lucide-react';
import { coachAPI } from '../../services/api.jsx';
import SwipeableCustomerCard from '../Swipeable/SwipeableCustomerCard';
import InvitationLinkModal from '../Modals/InvitationLinkModal';

function CustomersPage({ user, onNavigate, onBack }) {
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteCustomerName, setInviteCustomerName] = useState('');
  
  // Pull-to-refresh states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const PULL_THRESHOLD = 80;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    initial_credits: 0
  });

  // Pull-to-refresh handlers
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (pullStartY === 0 || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - pullStartY;
    
    if (distance > 0 && distance < 150) {
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > PULL_THRESHOLD) {
      setIsRefreshing(true);
      await refreshData();
      setIsRefreshing(false);
    }
    setPullStartY(0);
    setPullDistance(0);
  };

  const refreshData = async () => {
    await Promise.all([
      fetchCustomers(),
      fetchBookings()
    ]);
  };

  useEffect(() => {
    fetchCustomers();
    fetchBookings();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await coachAPI.getCustomers();
      setCustomers(response.data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await coachAPI.getCoachBookings();
      setBookings(response.data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const handleInviteCustomer = async (e) => {
    e.preventDefault();
    try {
      const response = await coachAPI.inviteCustomer(formData);
      
      if (response.data.invitation_link) {
        setInviteLink(response.data.invitation_link);
        setInviteCustomerName(`${formData.first_name} ${formData.last_name}`);
        setShowInviteModal(true);
        setShowAddModal(false);
        
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          initial_credits: 0
        });
        
        await fetchCustomers();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to invite customer');
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchTerm === '' || 
      `${customer.user?.first_name || customer.first_name} ${customer.user?.last_name || customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.user?.email || customer.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.user?.phone || customer.phone || '').includes(searchTerm);
    
    const matchesFilter = 
      customerFilter === 'all' ||
      (customerFilter === 'active' && (customer.session_credits || 0) > 0) ||
      (customerFilter === 'no-credits' && (customer.session_credits || 0) === 0);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-Refresh Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="fixed top-0 left-0 right-0 flex items-center justify-center bg-blue-600 text-white z-50 transition-all"
          style={{ 
            height: isRefreshing ? '50px' : `${Math.min(pullDistance, 50)}px`,
            opacity: isRefreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1)
          }}
        >
          {isRefreshing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span className="text-sm font-medium">Refreshing...</span>
            </div>
          ) : pullDistance > PULL_THRESHOLD ? (
            <span className="text-sm font-medium">Release to refresh</span>
          ) : (
            <span className="text-sm font-medium">Pull to refresh</span>
          )}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onBack ? onBack() : onNavigate('dashboard')}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                <p className="text-sm text-gray-600">
                  {customers.length} {customers.length === 1 ? 'client' : 'clients'} total
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 font-medium mb-1">Active Clients</p>
            <p className="text-2xl font-bold text-blue-600">
              {customers.filter(c => (c.session_credits || 0) > 0).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">with credits</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 font-medium mb-1">Inactive Clients</p>
            <p className="text-2xl font-bold text-gray-600">
              {customers.filter(c => (c.session_credits || 0) === 0).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">no credits</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 font-medium mb-1">Average Credits</p>
            <p className="text-2xl font-bold text-green-600">
              {customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + (c.session_credits || 0), 0) / customers.length) : 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">per client</p>
          </div>
        </div>

        {/* Search and Add Customer */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search clients by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-auto" />
            <span>Add Client</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setCustomerFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              customerFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setCustomerFilter('active')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              customerFilter === 'active'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-green-400'
            }`}
          >
            Active ({customers.filter(c => (c.session_credits || 0) > 0).length})
          </button>
          <button
            onClick={() => setCustomerFilter('no-credits')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              customerFilter === 'no-credits'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-orange-400'
            }`}
          >
            No Credits ({customers.filter(c => (c.session_credits || 0) === 0).length})
          </button>
        </div>

        {/* Customer List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm || customerFilter !== 'all' ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Try adjusting your search or filters' 
                : customerFilter !== 'all'
                ? 'No clients match this filter'
                : 'Get started by adding your first client'}
            </p>
            {!searchTerm && customerFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-5 w-auto" />
                <span>Add Your First Client</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => {
              const customerSessions = bookings.filter(b => b.customer_id === customer.id && b.status === 'confirmed');
              const lastSession = customerSessions.length > 0 
                ? customerSessions.sort((a, b) => new Date(b.end_time) - new Date(a.end_time))[0]
                : null;
              
              return (
                <SwipeableCustomerCard
                  key={customer.id}
                  customer={customer}
                  lastSession={lastSession}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onAddCredits={() => {}}
                  onViewPlans={() => {}}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Invite New Client</h2>
            <form onSubmit={handleInviteCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Credits</label>
                <input
                  type="number"
                  min="0"
                  value={formData.initial_credits}
                  onChange={(e) => setFormData({ ...formData, initial_credits: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Invite Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInviteModal && (
        <InvitationLinkModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          inviteLink={inviteLink}
          customerName={inviteCustomerName}
        />
      )}
    </div>
  );
}

export default CustomersPage;
