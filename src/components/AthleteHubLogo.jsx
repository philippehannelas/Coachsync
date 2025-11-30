import React from 'react';

const AthleteHubLogo = ({ className = "h-8 w-auto", color, style = {} }) => {
  // If color is specified and it's white/light, use a filter to make the logo white
  // Otherwise use the natural blue colors
  const imgStyle = color === 'white' || color === '#ffffff' || color === 'currentColor'
    ? { 
        ...style,
        filter: 'brightness(0) invert(1)', // Makes the logo white
        objectFit: 'contain'
      }
    : {
        ...style,
        objectFit: 'contain'
      };

  return (
    <img 
      src="/athletehub-logo.png" 
      alt="AthleteHub Logo" 
      className={className}
      style={imgStyle}
    />
  );
};

export default AthleteHubLogo;
