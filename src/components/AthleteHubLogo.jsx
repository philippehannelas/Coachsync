import React from 'react';

const AthleteHubLogo = ({ className = "h-8 w-8", style = {} }) => {
  return (
    <img 
      src="/athletehub-logo.png" 
      alt="AthleteHub" 
      className={className}
      style={style}
    />
  );
};

export default AthleteHubLogo;
