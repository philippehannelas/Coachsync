import React, { useState, useEffect } from 'react';
import { Upload, X, Check, Image, User, Palette, Trash2 } from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://coachsync-pro.onrender.com/api';

const BrandingSettings = () => {
  const [branding, setBranding] = useState({
    logo_url: '',
    profile_photo_url: '',
    business_name: '',
    motto: '',
    description: '',
    brand_color_primary: '#8B5CF6'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [logoPreview, setLogoPreview] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const token = localStorage.getItem('coachsync_token');
      const response = await axios.get(`${API_URL}/coach/branding`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranding(response.data);
    } catch (error) {
      console.error('Error fetching branding:', error);
    }
  };

  const handleTextChange = (field, value) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveText = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem('coachsync_token');
      const response = await axios.put(
        `${API_URL}/coach/branding`,
        {
          business_name: branding.business_name,
          motto: branding.motto,
          description: branding.description,
          brand_color_primary: branding.brand_color_primary
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setBranding(response.data.branding);
      setMessage({ type: 'success', text: 'Branding updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update branding' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem('coachsync_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/coach/branding/upload-logo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setBranding(prev => ({ ...prev, logo_url: response.data.logo_url }));
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload logo' });
      setLogoPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem('coachsync_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/coach/branding/upload-photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setBranding(prev => ({ ...prev, profile_photo_url: response.data.profile_photo_url }));
      setMessage({ type: 'success', text: 'Profile photo uploaded successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload photo' });
      setPhotoPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to delete your logo?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('coachsync_token');
      await axios.delete(`${API_URL}/coach/branding/delete-logo`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBranding(prev => ({ ...prev, logo_url: '' }));
      setLogoPreview(null);
      setMessage({ type: 'success', text: 'Logo deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete logo' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Are you sure you want to delete your profile photo?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('coachsync_token');
      await axios.delete(`${API_URL}/coach/branding/delete-photo`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBranding(prev => ({ ...prev, profile_photo_url: '' }));
      setPhotoPreview(null);
      setMessage({ type: 'success', text: 'Profile photo deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete photo' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Branding Settings</h1>
        <p className="text-gray-600 mt-1">Customize how your brand appears to your customers</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Logo Upload */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Image className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-800">Logo</h2>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200">
            {logoPreview || branding.logo_url ? (
              <img src={logoPreview || branding.logo_url} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Image className="w-12 h-12 text-gray-400" />
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload Logo</span>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
            
            {branding.logo_url && (
              <button
                onClick={handleDeleteLogo}
                className="ml-3 inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
            
            <p className="text-sm text-gray-500">Recommended: 500x500px, PNG or JPG, max 2MB</p>
          </div>
        </div>
      </div>

      {/* Profile Photo Upload */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-800">Profile Photo</h2>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200">
            {photoPreview || branding.profile_photo_url ? (
              <img src={photoPreview || branding.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-gray-400" />
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
            
            {branding.profile_photo_url && (
              <button
                onClick={handleDeletePhoto}
                className="ml-3 inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
            
            <p className="text-sm text-gray-500">Recommended: 400x400px, PNG or JPG, max 2MB</p>
          </div>
        </div>
      </div>

      {/* Text Fields */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Brand Information</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
          <input
            type="text"
            value={branding.business_name || ''}
            onChange={(e) => handleTextChange('business_name', e.target.value)}
            placeholder="e.g., Elite Performance Training"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Motto / Tagline</label>
          <input
            type="text"
            value={branding.motto || ''}
            onChange={(e) => handleTextChange('motto', e.target.value)}
            placeholder="e.g., Transform Your Performance"
            maxLength={255}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={branding.description || ''}
            onChange={(e) => handleTextChange('description', e.target.value)}
            placeholder="Tell your customers about your coaching philosophy and approach..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Brand Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={branding.brand_color_primary || '#8B5CF6'}
              onChange={(e) => handleTextChange('brand_color_primary', e.target.value)}
              className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={branding.brand_color_primary || '#8B5CF6'}
              onChange={(e) => handleTextChange('brand_color_primary', e.target.value)}
              placeholder="#8B5CF6"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">This color will be used for buttons and accents</p>
        </div>

        <button
          onClick={handleSaveText}
          disabled={loading}
          className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Branding'}
        </button>
      </div>

      {/* Preview */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer View Preview</h2>
        
        <div className="bg-white rounded-lg p-6 space-y-4">
          {/* Header Preview */}
          <div className="flex items-center gap-4 pb-4 border-b">
            {branding.logo_url && (
              <img src={branding.logo_url} alt="Logo" className="h-12 object-contain" />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-bold" style={{ color: branding.brand_color_primary }}>
                {branding.business_name || 'Your Business Name'}
              </h3>
              {branding.motto && (
                <p className="text-sm text-gray-600 italic">{branding.motto}</p>
              )}
            </div>
          </div>

          {/* Coach Info Preview */}
          {branding.profile_photo_url && (
            <div className="flex items-center gap-4">
              <img src={branding.profile_photo_url} alt="Coach" className="w-16 h-16 rounded-full object-cover" />
              <div>
                <p className="font-semibold text-gray-800">Your Coach</p>
                {branding.description && (
                  <p className="text-sm text-gray-600 mt-1">{branding.description.substring(0, 100)}{branding.description.length > 100 ? '...' : ''}</p>
                )}
              </div>
            </div>
          )}

          {/* Button Preview */}
          <button
            className="px-6 py-2 text-white font-semibold rounded-lg shadow-md"
            style={{ backgroundColor: branding.brand_color_primary }}
          >
            Sample Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandingSettings;
