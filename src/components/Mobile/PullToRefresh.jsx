import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const PullToRefresh = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const PULL_THRESHOLD = 80; // Distance to trigger refresh
  const MAX_PULL = 120; // Maximum pull distance

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      // Only allow pull-to-refresh when scrolled to top
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling || container.scrollTop > 0) return;

      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      // Only allow pulling down
      if (diff > 0) {
        e.preventDefault();
        const distance = Math.min(diff * 0.5, MAX_PULL); // Add resistance
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      setIsPulling(false);

      // Trigger refresh if pulled past threshold
      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh error:', error);
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        // Snap back
        setPullDistance(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  const rotation = isRefreshing ? 360 : (pullDistance / PULL_THRESHOLD) * 180;
  const opacity = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div ref={containerRef} className="pull-to-refresh-container">
      {/* Pull indicator */}
      <div 
        className="pull-to-refresh-indicator"
        style={{
          transform: `translateY(${pullDistance}px)`,
          opacity: opacity,
          transition: isPulling ? 'none' : 'all 0.3s ease-out',
        }}
      >
        <RefreshCw 
          size={24}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isRefreshing ? 'transform 1s linear infinite' : 'transform 0.2s ease-out',
          }}
          className={isRefreshing ? 'text-blue-600' : 'text-gray-400'}
        />
        <span className="pull-to-refresh-text">
          {isRefreshing ? 'Refreshing...' : pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
