import React, { useState, useRef, useEffect } from 'react';
import { Mail, Phone, Edit, Trash2, CreditCard, FileText } from 'lucide-react';

const SwipeableCustomerCard = ({ customer, onEdit, onDelete, onAddCredits, onViewPlans }) => {
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
    
    // Only allow left swipe (negative diff)
    if (diff < 0) {
      const offset = Math.max(diff, -MAX_SWIPE);
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
          title="View Training Plans"
        >
          <FileText size={20} />
        </button>
        <button
          className="swipe-action swipe-action-credits"
          onClick={() => {
            closeSwipe();
            onAddCredits(customer);
          }}
          title="Add Credits"
        >
          <CreditCard size={20} />
        </button>
        <button
          className="swipe-action swipe-action-delete"
          onClick={() => {
            closeSwipe();
            onDelete(customer.id);
          }}
          title="Delete Customer"
        >
          <Trash2 size={20} />
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
            <div className="customer-credits-badge">
              💳 {customer.session_credits || 0} credits
            </div>
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
            onClick={() => onEdit(customer)}
            style={{ background: '#F5F5F5', color: '#666666' }}
          >
            <Edit size={18} />
            Edit
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
