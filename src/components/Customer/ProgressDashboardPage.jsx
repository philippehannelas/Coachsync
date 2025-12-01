import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import MobilePageLayout from './MobilePageLayout';
import ProgressDashboard from './ProgressDashboard';

function ProgressDashboardPage() {
  const { user } = useAuth();

  return (
    <MobilePageLayout title="My Progress">
      <ProgressDashboard customerId={user?.id} />
    </MobilePageLayout>
  );
}

export default ProgressDashboardPage;
