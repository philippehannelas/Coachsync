import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import MobilePageLayout from './MobilePageLayout';
import WorkoutHistory from './WorkoutHistory';

function WorkoutHistoryPage() {
  const { user } = useAuth();

  return (
    <MobilePageLayout title="Workout History">
      <WorkoutHistory customerId={user?.id} />
    </MobilePageLayout>
  );
}

export default WorkoutHistoryPage;
