import React from 'react';

const AthleteHubLogo = ({ className = "h-8 w-8", color = "currentColor" }) => {
  return (
    <svg 
      viewBox="0 0 120 120" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* Background Mountain Peaks */}
      <path 
        d="M 20 85 L 40 55 L 60 75 L 80 45 L 100 75 L 120 85 L 120 120 L 0 120 L 0 85 Z" 
        fill={color}
        opacity="0.15"
      />
      
      {/* Middle Mountain Peak */}
      <path 
        d="M 30 90 L 60 40 L 90 90 Z" 
        fill={color}
        opacity="0.35"
      />
      
      {/* Main Mountain Peak (Tallest) */}
      <path 
        d="M 40 95 L 60 25 L 80 95 Z" 
        fill={color}
        opacity="0.6"
      />
      
      {/* Peak Highlight */}
      <path 
        d="M 55 25 L 60 15 L 65 25 Z" 
        fill={color}
        opacity="0.9"
      />
      
      {/* Athlete Silhouette at Peak - Victory Pose */}
      <g transform="translate(60, 20)" fill="white">
        {/* Head */}
        <circle cx="0" cy="0" r="3.5" />
        
        {/* Body */}
        <rect x="-1.5" y="3" width="3" height="8" rx="1.5" />
        
        {/* Arms - Raised in Victory */}
        <path d="M -1.5 5 L -6 0 L -5 -1 L -1 4 Z" />
        <path d="M 1.5 5 L 6 0 L 5 -1 L 1 4 Z" />
        
        {/* Legs */}
        <path d="M -1 11 L -3 17 L -1.5 17.5 L 0 12 Z" />
        <path d="M 1 11 L 3 17 L 1.5 17.5 L 0 12 Z" />
      </g>
      
      {/* Base/Ground */}
      <rect x="0" y="95" width="120" height="25" fill={color} opacity="0.2" />
      
      {/* Accent Lines for Depth */}
      <line x1="60" y1="25" x2="40" y2="95" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="60" y1="25" x2="80" y2="95" stroke={color} strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
};

export default AthleteHubLogo;
