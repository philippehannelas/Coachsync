import React, { useState } from 'react';
import { X, Copy, Check, Mail, MessageCircle, Share2 } from 'lucide-react';

/**
 * InvitationLinkModal Component
 * Shows invitation link after coach creates a customer
 * Allows coach to copy link and share manually
 */
const InvitationLinkModal = ({ isOpen, onClose, inviteLink, customerName }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const message = `Hi ${customerName}! I've invited you to CoachSync. Click this link to set your password and access your account: ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmail = () => {
    const subject = 'Your CoachSync Invitation';
    const body = `Hi ${customerName},\n\nI've invited you to CoachSync!\n\nClick this link to set your password and access your account:\n${inviteLink}\n\nThis link is valid for 7 days.\n\nSee you soon!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Customer Invited! 🎉</h2>
            <p className="text-sm text-gray-600 mt-1">Share this link with {customerName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Invitation Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invitation Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Share Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Share
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleWhatsApp}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
              >
                <MessageCircle className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium text-green-700">WhatsApp</span>
              </button>
              
              <button
                onClick={handleEmail}
                className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
              >
                <Mail className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Email</span>
              </button>
              
              <button
                onClick={handleCopy}
                className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
              >
                <Share2 className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Copy Link</span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Share this link with {customerName}</li>
              <li>They'll click the link and set their password</li>
              <li>They can then log in and book sessions</li>
            </ol>
            <p className="text-xs text-blue-700 mt-3">
              ⏰ This link is valid for <strong>7 days</strong>. You can generate a new one anytime.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitationLinkModal;

