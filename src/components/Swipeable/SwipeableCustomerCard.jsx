import React, { useState, useRef, useEffect } from 'react';
import { Mail, Phone, Edit, Trash2, CreditCard, FileText, Eye } from 'lucide-react';

const SwipeableCustomerCard = ({ customer, lastSession, onView, onEdit, onDelete, onAddCredits, onViewPlans }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const cardRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  const SWIPE_THRESHOLD = 80; // Minimum swipe distance to trigger action
  const MAX_SWIPE = 180; // Maximum swipe distance (increased for 3 buttons)

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Allow both left swipe (negative) and right swipe (positive) to close
    if (diff < 0) {
      // Swipe left to open
      const offset = Math.max(diff, -MAX_SWIPE);
      setSwipeOffset(offset);
    } else if (swipeOffset < 0) {
      // Swipe right to close (only if already open)
      const offset = Math.min(swipeOffset + diff * 0.5, 0);
      setSwipeOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    // If swiped past threshold, keep it open
    if (swipeOffset < -SWIPE_THRESHOLD) {
      setSwipeOffset(-MAX_SWIPE);
    } else {
      // Otherwise, snap back
      setSwipeOffset(0);
    }
  };

  const closeSwipe = () => {
    setSwipeOffset(0);
  };

  // Close swipe when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        closeSwipe();
      }
    };

    if (swipeOffset !== 0) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [swipeOffset]);

  return (
    <div className="swipeable-card-container" ref={cardRef}>
      {/* Swipe Actions (revealed on left swipe) */}
      <div className="swipe-actions-right">
        <button
          className="swipe-action swipe-action-plans"
          onClick={() => {
            closeSwipe();
            if (onViewPlans) onViewPlans(customer);
          }}
        >
          <FileText size={20} />
          <span className="swipe-action-label">Plans</span>
        </button>
        <button
          className="swipe-action swipe-action-credits"
          onClick={() => {
            closeSwipe();
            onAddCredits(customer);
          }}
        >
          <CreditCard size={20} />
          <span className="swipe-action-label">Credits</span>
        </button>
        <button
          className="swipe-action swipe-action-delete"
          onClick={() => {
            closeSwipe();
            onDelete(customer.id);
          }}
        >
          <Trash2 size={20} />
          <span className="swipe-action-label">Delete</span>
        </button>
      </div>

      {/* Customer Card */}
      <div
        className="customer-card-mobile swipeable-card"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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

        <div className="customer-actions-mobile">
          {(customer.user?.phone || customer.phone) && (
            <button
              className="customer-action-btn customer-action-call"
              onClick={() =>
                (window.location.href = `tel:${customer.user?.phone || customer.phone}`)
              }
            >
              <Phone size={18} />
              Call
            </button>
          )}
          {(customer.user?.email || customer.email) && (
            <button
              className="customer-action-btn customer-action-message"
              onClick={() =>
                (window.location.href = `mailto:${customer.user?.email || customer.email}`)
              }
            >
              <Mail size={18} />
              Email
            </button>
          )}
          <button
            className="customer-action-btn"
            onClick={() => onView(customer)}
            style={{ background: '#E0F2FE', color: '#0284C7' }}
          >
            <Eye size={18} />
            View
          </button>
          <button
            className="customer-action-btn"
            onClick={() => onEdit(customer)}
            style={{ background: '#F5F5F5', color: '#666666' }}
          >
            <Edit size={18} />
            Edit
          </button>
          <button
            className="customer-action-btn hidden md:flex"
            onClick={() => onAddCredits(customer)}
            style={{ background: '#D1FAE5', color: '#059669' }}
          >
            <CreditCard size={18} />
            Credits
          </button>
          <button
            className="customer-action-btn hidden md:flex"
            onClick={() => onViewPlans(customer)}
            style={{ background: '#EDE9FE', color: '#7C3AED' }}
          >
            <FileText size={18} />
            Plans
          </button>
        </div>

        {/* Swipe Hint */}
        {swipeOffset === 0 && (
          <div className="swipe-hint">
            ← Swipe for more actions
          </div>
        )}
      </div>
    </div>
  );
};

export default SwipeableCustomerCard;
