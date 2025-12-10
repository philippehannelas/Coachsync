import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, X, DollarSign, Calendar, CreditCard, Users } from 'lucide-react';
import axios from 'axios';

const PackagesPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    credits_per_period: '',
    is_unlimited: false,
    price: '',
    period_type: 'monthly',
    auto_renew: true,
    valid_days: [],
    valid_start_time: '',
    valid_end_time: ''
  });

  const API_URL = 'https://coachsync-web.onrender.com';
  
  console.log('🔧 PackagesPage loaded - API_URL:', API_URL);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem('token');
      const fullUrl = `${API_URL}/api/packages`;
      console.log('📡 Fetching packages from:', fullUrl);
      const response = await axios.get(fullUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Packages response:', response.data);
      setPackages(response.data.packages || []);
    } catch (error) {
      console.error('❌ Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        credits_per_period: parseInt(formData.credits_per_period),
        price: parseFloat(formData.price),
        valid_days: formData.valid_days.length > 0 ? formData.valid_days : null,
        valid_start_time: formData.valid_start_time || null,
        valid_end_time: formData.valid_end_time || null
      };
      
      const createUrl = `${API_URL}/api/packages`;
      console.log('📤 Creating package at:', createUrl, 'Payload:', payload);
      await axios.post(createUrl, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowCreateModal(false);
      resetForm();
      fetchPackages();
    } catch (error) {
      console.error('Error creating package:', error);
      alert('Failed to create package');
    }
  };

  const handleEditPackage = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        credits_per_period: parseInt(formData.credits_per_period),
        price: parseFloat(formData.price),
        valid_days: formData.valid_days.length > 0 ? formData.valid_days : null,
        valid_start_time: formData.valid_start_time || null,
        valid_end_time: formData.valid_end_time || null
      };
      
      await axios.put(`${API_URL}/api/packages/${selectedPackage.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowEditModal(false);
      resetForm();
      fetchPackages();
    } catch (error) {
      console.error('Error updating package:', error);
      alert('Failed to update package');
    }
  };

  const handleDeletePackage = async (packageId) => {
    if (!confirm('Are you sure you want to delete this package? This will cancel all active subscriptions.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/packages/${packageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package');
    }
  };

  const openEditModal = (pkg) => {
    setSelectedPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      credits_per_period: pkg.credits_per_period,
      is_unlimited: pkg.is_unlimited,
      price: pkg.price || '',
      period_type: pkg.period_type,
      auto_renew: pkg.auto_renew,
      valid_days: pkg.valid_days || [],
      valid_start_time: pkg.valid_start_time || '',
      valid_end_time: pkg.valid_end_time || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      credits_per_period: '',
      is_unlimited: false,
      price: '',
      period_type: 'monthly',
      auto_renew: true,
      valid_days: [],
      valid_start_time: '',
      valid_end_time: ''
    });
    setSelectedPackage(null);
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      valid_days: prev.valid_days.includes(day)
        ? prev.valid_days.filter(d => d !== day)
        : [...prev.valid_days, day]
    }));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const periodTypes = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'one_time', label: 'One Time' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Packages</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{packages.length} packages</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create</span>
            </button>
          </div>
        </div>
      </div>

      {/* Package List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading packages...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No packages yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first package to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Package
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Package Header */}
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white">
                  <h3 className="font-bold text-lg mb-1">{pkg.name}</h3>
                  <p className="text-sm opacity-90">{pkg.description || 'No description'}</p>
                </div>

                {/* Package Details */}
                <div className="p-4 space-y-3">
                  {/* Credits */}
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {pkg.is_unlimited ? 'Unlimited' : `${pkg.credits_per_period} credits`} / {pkg.period_type}
                    </span>
                  </div>

                  {/* Price */}
                  {pkg.price && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        ${pkg.price} {pkg.currency}
                      </span>
                    </div>
                  )}

                  {/* Auto Renew */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {pkg.auto_renew ? 'Auto-renews' : 'One-time'}
                    </span>
                  </div>

                  {/* Restrictions */}
                  {(pkg.valid_days?.length > 0 || pkg.valid_start_time) && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Restrictions:</p>
                      {pkg.valid_days?.length > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Days: {pkg.valid_days.map(d => dayNames[d]).join(', ')}
                        </p>
                      )}
                      {pkg.valid_start_time && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Time: {pkg.valid_start_time} - {pkg.valid_end_time}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={() => openEditModal(pkg)}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePackage(pkg.id)}
                    className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-2xl sm:rounded-xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {showEditModal ? 'Edit Package' : 'Create Package'}
              </h2>
              <button
                onClick={() => {
                  showCreateModal ? setShowCreateModal(false) : setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={showEditModal ? handleEditPackage : handleCreatePackage} className="p-6 space-y-4">
              {/* Package Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Elite Training"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Package description..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Credits & Unlimited */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Credits per Period *
                  </label>
                  <input
                    type="number"
                    required={!formData.is_unlimited}
                    disabled={formData.is_unlimited}
                    value={formData.credits_per_period}
                    onChange={(e) => setFormData({ ...formData, credits_per_period: e.target.value })}
                    placeholder="8"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-lg w-full">
                    <input
                      type="checkbox"
                      checked={formData.is_unlimited}
                      onChange={(e) => setFormData({ ...formData, is_unlimited: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Unlimited</span>
                  </label>
                </div>
              </div>

              {/* Price & Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="320.00"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Period *
                  </label>
                  <select
                    required
                    value={formData.period_type}
                    onChange={(e) => setFormData({ ...formData, period_type: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {periodTypes.map(pt => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Auto Renew */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_renew}
                    onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-renew subscription</span>
                </label>
              </div>

              {/* Valid Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valid Days (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {dayNames.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.valid_days.includes(index)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valid Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid From (optional)
                  </label>
                  <input
                    type="time"
                    value={formData.valid_start_time}
                    onChange={(e) => setFormData({ ...formData, valid_start_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid Until (optional)
                  </label>
                  <input
                    type="time"
                    value={formData.valid_end_time}
                    onChange={(e) => setFormData({ ...formData, valid_end_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    showCreateModal ? setShowCreateModal(false) : setShowEditModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                  {showEditModal ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;
