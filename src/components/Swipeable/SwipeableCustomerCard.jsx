import React from 'react';
import { Mail, Phone, Edit, Trash2, CreditCard, FileText, Eye } from 'lucide-react';

const SwipeableCustomerCard = ({ customer, lastSession, onView, onEdit, onDelete, onAddCredits, onViewPlans }) => {
  return (
    <div className="customer-card-mobile">
      <div className="customer-card-mobile-header">
        <div className="customer-avatar-mobile">
          {(customer.user?.first_name || customer.first_name)?.[0]}
          {(customer.user?.last_name || customer.last_name)?.[0]}
        </div>
        <div className="customer-info-mobile">
          <div className="customer-name-mobile">
            {customer.user?.first_name || customer.first_name}{' '}
            {customer.user?.last_name || customer.last_name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="customer-credits-badge">
              💳 {customer.session_credits || 0} credits
            </div>
            {customer.has_training_plan && (
              <div className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-md font-medium">
                📋 Plan
              </div>
            )}
          </div>
          {lastSession ? (
            <div className="text-xs text-gray-500 mt-1">
              Last session: {(() => {
                const endTime = new Date(lastSession.end_time);
                const now = new Date();
                const diffMs = now - endTime;
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) return 'today';
                if (diffDays === 1) return 'yesterday';
                if (diffDays < 7) return `${diffDays} days ago`;
                if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
                return `${Math.floor(diffDays / 30)} months ago`;
              })()}
            </div>
          ) : (
            <div className="text-xs text-gray-400 mt-1">
              No sessions yet
            </div>
          )}
        </div>
      </div>

      <div className="customer-contact-mobile">
        <div className="customer-contact-item-mobile">
          <Mail size={16} />
          <span>{customer.user?.email || customer.email || 'No email'}</span>
        </div>
        {(customer.user?.phone || customer.phone) && (
          <div className="customer-contact-item-mobile">
            <Phone size={16} />
            <span>{customer.user?.phone || customer.phone}</span>
          </div>
        )}
      </div>

      {/* All Action Buttons - Two Rows */}
      <div className="customer-actions-mobile-grid">
        {/* Row 1: Primary actions */}
        {(customer.user?.phone || customer.phone) && (
          <button
            className="customer-action-btn-compact customer-action-call"
            onClick={() =>
              (window.location.href = `tel:${customer.user?.phone || customer.phone}`)
            }
          >
            <Phone size={16} />
            <span>Call</span>
          </button>
        )}
        {(customer.user?.email || customer.email) && (
          <button
            className="customer-action-btn-compact customer-action-message"
            onClick={() =>
              (window.location.href = `mailto:${customer.user?.email || customer.email}`)
            }
          >
            <Mail size={16} />
            <span>Email</span>
          </button>
        )}
        <button
          className="customer-action-btn-compact customer-action-view"
          onClick={() => onView(customer)}
        >
          <Eye size={16} />
          <span>View</span>
        </button>
        <button
          className="customer-action-btn-compact customer-action-edit"
          onClick={() => onEdit(customer)}
        >
          <Edit size={16} />
          <span>Edit</span>
        </button>
        
        {/* Row 2: Secondary actions */}
        <button
          className="customer-action-btn-compact customer-action-credits"
          onClick={() => onAddCredits(customer)}
        >
          <CreditCard size={16} />
          <span>Credits</span>
        </button>
        <button
          className="customer-action-btn-compact customer-action-plans"
          onClick={() => onViewPlans(customer)}
        >
          <FileText size={16} />
          <span>Plans</span>
        </button>
        <button
          className="customer-action-btn-compact customer-action-delete"
          onClick={() => onDelete(customer.id)}
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default SwipeableCustomerCard;
