import React from 'react';
import { useParams } from 'react-router-dom';
import MobilePageLayout from './MobilePageLayout';
import WorkoutViewer from './WorkoutViewer';

function WorkoutViewerPage() {
  const { planId, dayNumber } = useParams();

  return (
    <MobilePageLayout 
      title={`Day ${dayNumber} Workout`}
      showBack={true}
      backPath="/customer/start-workout"
      showBottomNav={false}  // Hide bottom nav during workout for full focus
    >
      <WorkoutViewer 
        trainingPlanId={planId} 
        dayNumber={parseInt(dayNumber)} 
      />
    </MobilePageLayout>
  );
}

export default WorkoutViewerPage;
