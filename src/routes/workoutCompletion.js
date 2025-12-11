const API_BASE_URL = 'https://coachsync-pro.onrender.com';

const getAuthHeaders = () => {
  const token = localStorage.getItem('coachsync_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const getWorkoutForDay = async (trainingPlanId, dayNumber) => {
  const response = await fetch(
    `${API_BASE_URL}/customer/workouts/${trainingPlanId}/day/${dayNumber}`,
    {
      headers: getAuthHeaders()
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch workout');
  }
  
  return response.json();
};

export const completeWorkout = async (workoutData) => {
  const response = await fetch(
    `${API_BASE_URL}/customer/workouts/complete`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(workoutData)
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to complete workout');
  }
  
  return response.json();
};

export const getWorkoutHistory = async (days = 30) => {
  const response = await fetch(
    `${API_BASE_URL}/customer/workouts/history?days=${days}`,
    {
      headers: getAuthHeaders()
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch workout history');
  }
  
  return response.json();
};

export const getCustomerStats = async () => {
  const response = await fetch(
    `${API_BASE_URL}/customer/stats`,
    {
      headers: getAuthHeaders()
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  
  return response.json();
};

// Coach endpoints
export const getCustomerWorkoutHistory = async (customerId, days = 30) => {
  const response = await fetch(
    `${API_BASE_URL}/coach/customers/${customerId}/workout-history?days=${days}`,
    {
      headers: getAuthHeaders()
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch customer workout history');
  }
  
  return response.json();
};

export const getCustomerStatsCoach = async (customerId) => {
  const response = await fetch(
    `${API_BASE_URL}/coach/customers/${customerId}/stats`,
    {
      headers: getAuthHeaders()
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch customer stats');
  }
  
  return response.json();
};
