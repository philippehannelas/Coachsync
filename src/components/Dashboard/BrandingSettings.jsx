import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Palette, Save, Image as ImageIcon, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function BrandingSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [branding, setBranding] = useState({
    logo_url: '',
    profile_photo_url: '',
    business_name: '',
    motto: '',
    description: '',
    brand_color_primary: '#625ff7'
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const response = await api.get('/branding');
      if (response.data) {
        setBranding({
          logo_url: response.data.logo_url || '',
          profile_photo_url: response.data.profile_photo_url || '',
          business_name: response.data.business_name || '',
          motto: response.data.motto || '',
          description: response.data.description || '',
          brand_color_primary: response.data.brand_color_primary || '#625ff7'
        });
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
      setMessage({ type: 'error', text: 'Failed to load branding settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Logo file size must be less than 2MB' });
      return;
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Logo must be PNG, JPG, or SVG' });
      return;
    }

    try {
      setUploadingLogo(true);
      setMessage({ type: '', text: '' });

      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post('/branding/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setBranding(prev => ({ ...prev, logo_url: response.data.logo_url }));
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to upload logo' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Photo file size must be less than 2MB' });
      return;
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Photo must be PNG or JPG' });
      return;
    }

    try {
      setUploadingPhoto(true);
      setMessage({ type: '', text: '' });

      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/branding/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setBranding(prev => ({ ...prev, profile_photo_url: response.data.profile_photo_url }));
      setMessage({ type: 'success', text: 'Profile photo uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading photo:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to upload photo' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      await api.put('/branding', {
        business_name: branding.business_name,
        motto: branding.motto,
        description: branding.description,
        brand_color_primary: branding.brand_color_primary
      });

      setMessage({ type: 'success', text: 'Branding settings saved successfully!' });
    } catch (error) {
      console.error('Error saving branding:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save branding settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/coach/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Branding Settings</h1>
          <p className="text-gray-600 mt-2">Customize your brand appearance for your customers</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Form */}
          <div className="space-y-6">
            {/* Logo Upload */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <ImageIcon className="h-5 w-5 mr-2 text-blue-600" />
                Logo
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload your business logo (PNG, JPG, or SVG, max 2MB)
              </p>
              {branding.logo_url && (
                <div className="mb-4">
                  <img 
                    src={branding.logo_url} 
                    alt="Current Logo" 
                    className="h-20 object-contain border border-gray-200 rounded-lg p-2"
                  />
                </div>
              )}
              <label className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer transition-colors">
                <Upload className="h-5 w-5" />
                <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>
            </div>

            {/* Profile Photo Upload */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-purple-600" />
                Profile Photo
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload your profile photo (PNG or JPG, max 2MB)
              </p>
              {branding.profile_photo_url && (
                <div className="mb-4">
                  <img 
                    src={branding.profile_photo_url} 
                    alt="Current Profile" 
                    className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                  />
                </div>
              )}
              <label className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg cursor-pointer transition-colors">
                <Upload className="h-5 w-5" />
                <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>

            {/* Business Information */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Business Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={branding.business_name}
                    onChange={(e) => setBranding(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="e.g., Elite Performance Coaching"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motto / Tagline
                  </label>
                  <input
                    type="text"
                    value={branding.motto}
                    onChange={(e) => setBranding(prev => ({ ...prev, motto: e.target.value }))}
                    placeholder="e.g., Unlock Your Potential"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={branding.description}
                    onChange={(e) => setBranding(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell your customers about your coaching philosophy and approach..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Brand Color */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Palette className="h-5 w-5 mr-2 text-orange-600" />
                Brand Color
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Choose a primary color for your brand
              </p>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={branding.brand_color_primary}
                  onChange={(e) => setBranding(prev => ({ ...prev, brand_color_primary: e.target.value }))}
                  className="h-12 w-20 rounded-lg cursor-pointer border-2 border-gray-300"
                />
                <input
                  type="text"
                  value={branding.brand_color_primary}
                  onChange={(e) => setBranding(prev => ({ ...prev, brand_color_primary: e.target.value }))}
                  placeholder="#625ff7"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? 'Saving...' : 'Save Branding Settings'}</span>
            </button>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Live Preview</h2>
              <p className="text-sm text-gray-600 mb-6">
                This is how your branding will appear to your customers
              </p>

              {/* Preview Header */}
              <div 
                className="rounded-lg p-6 mb-6 text-white"
                style={{ background: `linear-gradient(to right, ${branding.brand_color_primary}, ${branding.brand_color_primary}dd)` }}
              >
                <div className="flex items-center space-x-4">
                  {branding.logo_url ? (
                    <img 
                      src={branding.logo_url} 
                      alt="Logo Preview" 
                      className="h-12 object-contain bg-white/20 rounded-lg p-2"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">
                      {branding.business_name || 'Your Business Name'}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {branding.motto || 'Your motto will appear here'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Profile Card */}
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  {branding.profile_photo_url ? (
                    <img 
                      src={branding.profile_photo_url} 
                      alt="Profile Preview" 
                      className="w-20 h-20 rounded-full object-cover border-4 shadow-lg"
                      style={{ borderColor: branding.brand_color_primary }}
                    />
                  ) : (
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-lg"
                      style={{ borderColor: branding.brand_color_primary, backgroundColor: `${branding.brand_color_primary}15` }}
                    >
                      <User className="h-10 w-10" style={{ color: branding.brand_color_primary }} />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900">
                      {branding.business_name || 'Your Business Name'}
                    </h4>
                    <p className="text-sm font-medium mt-1" style={{ color: branding.brand_color_primary }}>
                      {branding.motto || 'Your motto will appear here'}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {branding.description || 'Your description will appear here. Tell your customers about your coaching philosophy and approach.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Button */}
              <button
                className="w-full mt-6 px-6 py-3 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
                style={{ backgroundColor: branding.brand_color_primary }}
              >
                Sample Button with Brand Color
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandingSettings;
