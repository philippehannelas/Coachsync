import React from 'react';

const AthleteHubLogo = ({ className = "h-8 w-8", style = {} }) => {
  return (
    <img 
      src="/icon-512x512.png" 
      alt="AthleteHub Logo" 
      className={className}
      style={style}
    />
  );
};

export default AthleteHubLogo;
