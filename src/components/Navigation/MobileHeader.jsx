import React from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MobileHeader = ({ title, showBack = false, onBack, actions, rightAction }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="mobile-header">
      {showBack && (
        <button 
          className="mobile-header-action" 
          onClick={handleBack}
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
      )}
      <h1 className="mobile-header-title">{title}</h1>
      {(actions || rightAction) && (
        <button 
          className="mobile-header-action"
          onClick={rightAction}
          aria-label="More options"
        >
          <MoreVertical size={24} />
        </button>
      )}
    </header>
  );
};

export default MobileHeader;
