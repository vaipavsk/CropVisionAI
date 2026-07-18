import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to consume the AuthContext.
 * @returns {Object} The authentication state and methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;
