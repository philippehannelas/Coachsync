import React from 'react';

const AthleteHubLogo = ({ className = "h-8 w-8", color = "currentColor" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* Main Mountain Peak - Bold and Clear */}
      <path 
        d="M 50 15 L 20 75 L 80 75 Z" 
        fill={color}
        opacity="0.9"
      />
      
      {/* Left Secondary Peak */}
      <path 
        d="M 30 75 L 10 75 L 20 55 Z" 
        fill={color}
        opacity="0.6"
      />
      
      {/* Right Secondary Peak */}
      <path 
        d="M 70 75 L 90 75 L 80 55 Z" 
        fill={color}
        opacity="0.6"
      />
      
      {/* Snow Cap/Highlight on Main Peak */}
      <path 
        d="M 50 15 L 42 30 L 58 30 Z" 
        fill="white"
        opacity="0.8"
      />
      
      {/* Athlete Silhouette - Victory Pose at Summit */}
      <g transform="translate(50, 20)" fill="white" opacity="0.95">
        {/* Head */}
        <circle cx="0" cy="0" r="2.5" />
        
        {/* Body */}
        <rect x="-1" y="2.5" width="2" height="6" rx="1" />
        
        {/* Left Arm - Raised */}
        <path d="M -1 4 L -4.5 0.5 L -3.5 -0.5 L -0.5 3 Z" />
        
        {/* Right Arm - Raised */}
        <path d="M 1 4 L 4.5 0.5 L 3.5 -0.5 L 0.5 3 Z" />
        
        {/* Left Leg */}
        <path d="M -0.8 8.5 L -2 13 L -0.8 13.2 L 0 9 Z" />
        
        {/* Right Leg */}
        <path d="M 0.8 8.5 L 2 13 L 0.8 13.2 L 0 9 Z" />
      </g>
      
      {/* Base/Ground Line */}
      <rect x="0" y="75" width="100" height="5" fill={color} opacity="0.3" />
      
      {/* Accent Lines for Depth */}
      <line x1="50" y1="15" x2="35" y2="50" stroke="white" strokeWidth="0.5" opacity="0.4" />
      <line x1="50" y1="15" x2="65" y2="50" stroke="white" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
};

export default AthleteHubLogo;
