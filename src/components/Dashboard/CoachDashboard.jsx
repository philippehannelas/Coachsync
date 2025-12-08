import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit, Trash2, CreditCard, LogOut, Mail, Phone, User, Calendar, Clock, ChevronRight, Palette } from 'lucide-react';
import AthleteHubLogo from '../AthleteHubLogo';
import { coachAPI } from '../../services/api.jsx';
import InvitationLinkModal from '../Modals/InvitationLinkModal';

function CoachDashboard({ user, onLogout, onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false); // Used for the invite modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ NEW: Invitation modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteCustomerName, setInviteCustomerName] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [branding, setBranding] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    initial_credits: 0
  });

  const [creditsAmount, setCreditsAmount] = useState(0);

  useEffect(() => {
    fetchCustomers();
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const response = await coachAPI.getBranding();
      setBranding(response.data);
    } catch (error) {
      console.log('No branding set yet:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await coachAPI.getCustomers();
      setCustomers(response.data || []);
      
      // Also fetch bookings for today's sessions
      try {
        const bookingsResponse = await fetch('https://coachsync-pro.onrender.com/api/coach/bookings', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setBookings(bookingsData || []);
        }
      } catch (bookingErr) {
        console.error('Error fetching bookings:', bookingErr);
      }
    } catch (err) {
      setError('Failed to load customers');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteCustomer = async (e) => {
    e.preventDefault();
    
    // Validate at least one contact method
    if (!formData.email?.trim() && !formData.phone?.trim()) {
      setError('Please provide at least one contact method (email or phone)');
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    try {
      // The backend handles user creation, profile linking, and token generation
      const response = await coachAPI.inviteCustomer(formData);
      
      // If setup_token is returned, show the invitation link
      if (response.data.setup_token) {
        const frontendBaseUrl = import.meta.env.DEV ? 'http://localhost:5173' : 'https://coachsync-web.onrender.com';
        const inviteUrl = `${frontendBaseUrl}/accept-invite?token=${response.data.setup_token}`;
        
        setInviteLink(inviteUrl);
        setInviteCustomerName(`${formData.first_name} ${formData.last_name}`);
        setShowInviteModal(true);
      }
      
      setShowAddModal(false); // Close the invite form modal
      setFormData({ first_name: '', last_name: '', email: '', phone: '', initial_credits: 0 });
      fetchCustomers(); // Refresh customer list to show the new customer
      setSuccess(`Customer ${formData.first_name} ${formData.last_name} created successfully!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to invite customer');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    
    // Validate at least one contact method
    if (!formData.email?.trim() && !formData.phone?.trim()) {
      setError('Please provide at least one contact method (email or phone)');
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    try {
      await coachAPI.updateCustomer(selectedCustomer.id, formData);
      setSuccess('Customer updated successfully!');
      setShowEditModal(false);
      setSelectedCustomer(null);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update customer');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await coachAPI.deleteCustomer(customerId);
        setSuccess('Customer deleted successfully!');
        fetchCustomers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete customer');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleAddCredits = async (e) => {
    e.preventDefault();
    try {
      await coachAPI.addCredits(selectedCustomer.id, creditsAmount);
      setSuccess(`Added ${creditsAmount} credits successfully!`);
      setShowCreditsModal(false);
      setSelectedCustomer(null);
      setCreditsAmount(0);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add credits');
      setTimeout(() => setError(''), 3000);
    }
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

  const openCreditsModal = (customer) => {
    setSelectedCustomer(customer);
    setShowCreditsModal(true);
  };

  const filteredCustomers = customers.filter(customer => {
    const firstName = customer.user?.first_name || customer.first_name || '';
    const lastName = customer.user?.last_name || customer.last_name || '';
    const email = customer.user?.email || customer.email || '';
    const phone = customer.user?.phone || customer.phone || '';
    return firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200" style={branding?.brand_color_primary ? { background: `linear-gradient(to right, ${branding.brand_color_primary}, ${branding.brand_color_primary}dd)` } : {}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="h-8 w-auto" />
              ) : (
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                  <AthleteHubLogo className="h-6 w-auto" color="white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold" style={branding?.brand_color_primary ? { color: 'white' } : { color: '#111827' }}>
                  {branding?.business_name || 'AthleteHub'}
                </h1>
                <p className="text-sm" style={branding?.brand_color_primary ? { color: 'rgba(255,255,255,0.9)' } : { color: '#4B5563' }}>
                  {branding?.motto || `Welcome back, ${user.first_name}!`}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg animate-fade-in">
            <p className="text-green-800 font-semibold">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-fade-in">
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        )}

        {/* Today's Sessions Section */}
        {(() => {
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
          
          const todaySessions = bookings
            .filter(b => {
              const startTime = new Date(b.start_time);
              return startTime >= todayStart && startTime < todayEnd && b.status === 'confirmed';
            })
            .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

          if (todaySessions.length === 0) return null;

          return (
            <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-md p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-purple-600" />
                  Today's Sessions
                  <span className="ml-2 px-3 py-1 bg-purple-600 text-white text-sm rounded-full">
                    {todaySessions.length}
                  </span>
                </h2>
                <button
                  onClick={() => onNavigate('calendar')}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors border border-purple-200"
                >
                  View Calendar
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todaySessions.map((session) => {
                  const startTime = new Date(session.start_time);
                  const endTime = new Date(session.end_time);
                  const isPast = endTime <= now;
                  const isCurrent = startTime <= now && endTime > now;
                  
                  return (
                    <div
                      key={session.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isCurrent
                          ? 'bg-green-50 border-green-500 shadow-lg'
                          : isPast
                          ? 'bg-gray-50 border-gray-300'
                          : 'bg-white border-purple-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {session.customer?.name || session.event_title || 'Session'}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {startTime.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                            {' - '}
                            {endTime.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {isCurrent && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                            Now
                          </span>
                        )}
                        {isPast && (
                          <span className="px-2 py-1 bg-gray-400 text-white text-xs rounded-full font-medium">
                            Done
                          </span>
                        )}
                      </div>
                      {session.notes && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {session.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Stats */}
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">
                    In Progress: {todaySessions.filter(s => new Date(s.start_time) <= now && new Date(s.end_time) > now).length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                  <span className="text-gray-700">
                    Upcoming: {todaySessions.filter(s => new Date(s.start_time) > now).length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                  <span className="text-gray-700">
                    Completed: {todaySessions.filter(s => new Date(s.end_time) <= now).length}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Customers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{customers.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Credits</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {customers.reduce((sum, c) => sum + (c.session_credits || 0), 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Sessions Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {(() => {
                    const now = new Date();
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
                    return bookings.filter(b => {
                      const startTime = new Date(b.start_time);
                      return startTime >= todayStart && startTime < todayEnd && b.status === 'confirmed';
                    }).length;
                  })()}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-5 w-auto" />
            <span>Add Customer</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('training-plans')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <AthleteHubLogo className="h-5 w-auto" color="currentColor" />
            <span>Training Plans</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('calendar')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <AthleteHubLogo className="h-5 w-auto" color="currentColor" />
            <span>View Calendar</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('branding')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <Palette className="h-5 w-auto" />
            <span>Branding</span>
          </button>
        </div>

        {/* Customers Section - Collapsible */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div 
            className="p-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200"
            onClick={() => setShowCustomerList(!showCustomerList)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Customer Management</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {customers.length} {customers.length === 1 ? 'customer' : 'customers'} total
                    {filteredCustomers.length !== customers.length && (
                      <span className="text-blue-600 font-medium"> • {filteredCustomers.length} matching search</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {showCustomerList ? 'Click to hide' : 'Click to view all'}
                </span>
                <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${showCustomerList ? 'rotate-90' : ''}`} />
              </div>
            </div>
          </div>

          {/* Collapsible Content */}
          {showCustomerList && (
            <div className="p-6 bg-gray-50">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Active Customers</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {customers.filter(c => (c.session_credits || 0) > 0).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">with credits</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Inactive Customers</p>
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
                  <p className="text-xs text-gray-500 mt-1">per customer</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No customers found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first customer'}
                  </p>
                  {!searchTerm && (
	              <button
	                  onClick={() => setShowAddModal(true)}
	                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
	                >
	                  <Plus className="h-5 w-auto" />
	                  <span>Invite Your First Customer</span>
	                </button>
                  )}
                </div>
              ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl border-l-4 border-blue-500 p-6 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {customer.user?.first_name || customer.first_name} {customer.user?.last_name || customer.last_name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        Customer
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{customer.user?.email || customer.email || 'No email'}</span>
                  </div>
                  {(customer.user?.phone || customer.phone) && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{customer.user?.phone || customer.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-semibold text-gray-900">
                      {customer.session_credits || 0} credits
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openEditModal(customer)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 text-sm"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => openCreditsModal(customer)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Credits</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer.id)}
                    className="flex items-center justify-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
              )}
            </div>
          )}
        </div>
      </main>

	      {/* Invite Customer Modal */}
	      {showAddModal && (
	        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
	          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform animate-slide-up">
	            <h2 className="text-2xl font-bold text-gray-900 mb-6">Invite New Customer</h2>
	            <form onSubmit={handleInviteCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <p className="text-xs text-gray-500 mt-1">* At least one contact method (email or phone) is required</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Credits</label>
                <input
                  type="number"
                  min="0"
                  value={formData.initial_credits}
                  onChange={(e) => setFormData({ ...formData, initial_credits: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
	                <button
	                  type="submit"
	                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
	                >
	                  Generate Invite Link
	                </button>
              </div>
            </form>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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

      {/* Add Credits Modal */}
      {showCreditsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform animate-slide-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Credits</h2>
            <p className="text-gray-600 mb-4">
              Add session credits for <span className="font-semibold">{selectedCustomer?.first_name} {selectedCustomer?.last_name}</span>
            </p>
            <form onSubmit={handleAddCredits} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Credits</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter number of credits"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreditsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Add Credits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ NEW: Invitation Link Modal */}
      <InvitationLinkModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteLink={inviteLink}
        customerName={inviteCustomerName}
      />
    </div>
  );
}

export default CoachDashboard;

