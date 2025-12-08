import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const BottomSheet = ({ isOpen, onClose, title, children, maxHeight = '85vh' }) => {
  // Prevent body scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div 
        className="bottom-sheet"
        style={{ maxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="bottom-sheet-handle-container">
          <div className="bottom-sheet-handle" />
        </div>

        {/* Header */}
        <div className="bottom-sheet-header">
          <h2 className="bottom-sheet-title">{title}</h2>
          <button 
            className="bottom-sheet-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
