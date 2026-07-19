import { useContext } from 'react';
import { RoleContext } from '../context/RoleContext';

/**
 * Custom hook to consume the RoleContext.
 * @returns {Object} The user role state and helpers.
 */
export const useRole = () => {
  const context = useContext(RoleContext);
  
  if (context === undefined || context === null) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  
  return context;
};

export default useRole;
