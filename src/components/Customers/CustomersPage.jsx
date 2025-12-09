import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, ArrowLeft, Edit, CreditCard } from 'lucide-react';
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
  
  // View/Edit modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
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

  // Handler functions for customer actions
  const openViewModal = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      first_name: customer.user?.first_name || customer.first_name || '',
      last_name: customer.user?.last_name || customer.last_name || '',
      email: customer.user?.email || customer.email || '',
      phone: customer.user?.phone || customer.phone || '',
      initial_credits: customer.session_credits || 0
    });
    setShowEditModal(true);
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    
    if (!formData.email?.trim() && !formData.phone?.trim()) {
      setError('Please provide at least one contact method (email or phone)');
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    try {
      await coachAPI.updateCustomer(selectedCustomer.id, formData);
      setShowEditModal(false);
      setSelectedCustomer(null);
      await fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update customer');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await coachAPI.deleteCustomer(customerId);
        await fetchCustomers();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete customer');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleAddCredits = (customer) => {
    openEditModal(customer);
  };

  const handleViewPlans = (customer) => {
    console.log('View plans for customer:', customer);
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
                  onView={() => openViewModal(customer)}
                  onEdit={() => openEditModal(customer)}
                  onDelete={() => handleDeleteCustomer(customer.id)}
                  onAddCredits={() => handleAddCredits(customer)}
                  onViewPlans={() => handleViewPlans(customer)}
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

      {/* View Customer Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                  {(selectedCustomer?.user?.first_name || selectedCustomer?.first_name)?.[0]}
                  {(selectedCustomer?.user?.last_name || selectedCustomer?.last_name)?.[0]}
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedCustomer?.user?.first_name || selectedCustomer?.first_name}{' '}
                  {selectedCustomer?.user?.last_name || selectedCustomer?.last_name}
                </h3>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                  <CreditCard size={16} />
                  {selectedCustomer?.session_credits || 0} Credits
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="border-b border-gray-200 pb-3">
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900 mt-1">{selectedCustomer?.user?.email || selectedCustomer?.email || 'Not provided'}</p>
                </div>
                <div className="border-b border-gray-200 pb-3">
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900 mt-1">{selectedCustomer?.user?.phone || selectedCustomer?.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(selectedCustomer);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Edit size={18} />
                  Edit Details
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Customer</h2>
            <form onSubmit={handleEditCustomer} className="space-y-4">
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
                  Phone (8 digits) <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  pattern="[0-9]{8}"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">* At least one contact method (email or phone) is required</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersPage;
