import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI, setToken, removeToken, getToken } from '../services/api.jsx';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app start
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
        } catch (error) {
          console.error('Auth check failed:', error);
          removeToken();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user: userData } = response.data;
      
      setToken(token);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { 
        success: true, 
        message: response.data?.message || 'Registration successful' 
      };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
      removeToken();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove token and user on error
      removeToken();
      setUser(null);
    }
  };

  // Check if user is a coach
  const isCoach = user?.role === 'coach';
  const isCustomer = user?.role === 'customer';

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isCoach,
    isCustomer,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;

