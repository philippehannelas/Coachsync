import React from 'react';

// Generic skeleton box
export const SkeletonBox = ({ width = '100%', height = '20px', className = '' }) => (
  <div 
    className={`skeleton ${className}`}
    style={{ width, height }}
  />
);

// Skeleton for customer card
export const CustomerCardSkeleton = () => (
  <div className="customer-card-mobile">
    <div className="customer-card-mobile-header">
      <div className="skeleton skeleton-avatar" />
      <div className="customer-info-mobile" style={{ flex: 1 }}>
        <SkeletonBox width="60%" height="20px" className="mb-2" />
        <SkeletonBox width="40%" height="16px" />
      </div>
    </div>

    <div className="customer-contact-mobile">
      <SkeletonBox width="80%" height="16px" className="mb-2" />
      <SkeletonBox width="60%" height="16px" />
    </div>

    <div className="customer-actions-mobile">
      <SkeletonBox width="100%" height="44px" />
      <SkeletonBox width="100%" height="44px" />
      <SkeletonBox width="100%" height="44px" />
    </div>
  </div>
);

// Skeleton for training plan card
export const TrainingPlanCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
    <div className="flex items-start justify-between mb-4">
      <div style={{ flex: 1 }}>
        <SkeletonBox width="70%" height="24px" className="mb-2" />
        <SkeletonBox width="90%" height="16px" />
      </div>
      <SkeletonBox width="80px" height="28px" />
    </div>

    <div className="grid grid-cols-2 gap-4 mb-4">
      <SkeletonBox width="100%" height="16px" />
      <SkeletonBox width="100%" height="16px" />
      <SkeletonBox width="100%" height="16px" />
      <SkeletonBox width="100%" height="16px" />
    </div>

    <SkeletonBox width="100%" height="44px" />
  </div>
);

// Skeleton for stats card
export const StatsCardSkeleton = () => (
  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
    <SkeletonBox width="60%" height="14px" className="mb-2" />
    <SkeletonBox width="40%" height="32px" className="mb-1" />
    <SkeletonBox width="50%" height="12px" />
  </div>
);

// Multiple skeleton cards
export const SkeletonList = ({ count = 3, Component = CustomerCardSkeleton }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <Component key={index} />
    ))}
  </>
);

export default {
  Box: SkeletonBox,
  CustomerCard: CustomerCardSkeleton,
  TrainingPlanCard: TrainingPlanCardSkeleton,
  StatsCard: StatsCardSkeleton,
  List: SkeletonList,
};
