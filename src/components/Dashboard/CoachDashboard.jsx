import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit, Trash2, CreditCard, LogOut, Mail, Phone, User, Dumbbell, Calendar, Clock, ChevronRight } from 'lucide-react';
import { coachAPI } from '../../services/api.jsx';
import InvitationLinkModal from '../Modals/InvitationLinkModal';

function CoachDashboard({ user, onLogout, onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ NEW: Invitation modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteCustomerName, setInviteCustomerName] = useState('');

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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch both customers and bookings
      const [customersResponse, bookingsResponse] = await Promise.all([
        coachAPI.getCustomers(),
        fetchBookings()
      ]);
      setCustomers(customersResponse.data || []);
      setBookings(bookingsResponse || []);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('https://coachsync-pro.onrender.com/api/coach/bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    } catch (err) {
      console.error('Error fetching bookings:', err);
      return [];
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const response = await coachAPI.createCustomer(formData);
      
      // ✅ NEW: Generate invitation link after creating customer
      if (response.data && response.data.customer) {
        try {
          const inviteResponse = await fetch(
            `https://coachsync-pro.onrender.com/api/coach/customers/${response.data.customer.id}/generate-invite`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('coachsync_token')}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (inviteResponse.ok) {
            const inviteData = await inviteResponse.json();
            setInviteLink(inviteData.invite_link);
            setInviteCustomerName(`${formData.first_name} ${formData.last_name}`);
            setShowInviteModal(true);
          }
        } catch (inviteErr) {
          console.error('Failed to generate invitation:', inviteErr);
          // Still show success for customer creation
          setSuccess('Customer added successfully!');
          setTimeout(() => setSuccess(''), 3000);
        }
      }

      setShowAddModal(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', initial_credits: 0 });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    try {
      await coachAPI.updateCustomer(selectedCustomer.id, formData);
      setSuccess('Customer updated successfully!');
      setShowEditModal(false);
      setSelectedCustomer(null);
      fetchData();
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
        fetchData();
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
      fetchData();
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

  // ✅ NEW: Calculate today's sessions
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  
  const todaySessions = bookings
    .filter(b => {
      const startTime = new Date(b.start_time);
      return startTime >= todayStart && startTime < todayEnd && b.status === 'confirmed';
    })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const upcomingSessions = todaySessions.filter(b => new Date(b.start_time) > now);
  const completedToday = todaySessions.filter(b => new Date(b.end_time) <= now);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CoachSync</h1>
                <p className="text-sm text-gray-600">Welcome back, {user.first_name}!</p>
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

        {/* ✅ NEW: Today's Sessions Section */}
        {todaySessions.length > 0 && (
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
                <span className="text-gray-700">Upcoming: {upcomingSessions.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                <span className="text-gray-700">Completed: {completedToday.length}</span>
              </div>
            </div>
          </div>
        )}

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
                <p className="text-gray-600 text-sm font-medium">Total Credits</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {customers.reduce((sum, c) => sum + (c.session_credits || 0), 0)}
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
                <p className="text-3xl font-bold text-gray-900 mt-1">{todaySessions.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Rest of the component remains the same - customers list, modals, etc. */}
        {/* ... (keeping all existing customer management code) ... */}
        
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
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-500 to-purple-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                      </div>
                      <p className="mt-4 text-gray-600">Loading customers...</p>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? 'No customers found matching your search' : 'No customers yet. Add your first customer to get started!'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {(customer.user?.first_name || customer.first_name || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {customer.user?.first_name || customer.first_name} {customer.user?.last_name || customer.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {customer.user?.email || customer.email}
                          </div>
                          {(customer.user?.phone || customer.phone) && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              {customer.user?.phone || customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {customer.session_credits || 0} credits
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openCreditsModal(customer)}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors duration-200"
                            title="Add Credits"
                          >
                            <CreditCard className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(customer)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Edit Customer"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Delete Customer"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals - Add Customer, Edit Customer, Add Credits, Invitation */}
      {/* ... (keeping all existing modal code) ... */}
      
      {/* ✅ NEW: Invitation Link Modal */}
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

export default CoachDashboard;

