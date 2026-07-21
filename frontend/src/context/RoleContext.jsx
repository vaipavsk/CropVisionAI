import { createContext, useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';

export const RoleContext = createContext(null);

export const RoleProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [roleUser, setRoleUser] = useState(null);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const fetchRoleProfile = async () => {
    try {
      setLoadingRole(true);
      const response = await api.get('/users/me');
      if (response.data) {
        setRoleUser(response.data);
        setRole(response.data.role);
        setStatus(response.data.status);
        return response.data;
      }
      return null;
    } catch (err) {
      console.warn('Failed to retrieve database user profile:', err?.response?.data?.detail || err.message);
      setRoleUser(null);
      setRole(null);
      setStatus(null);
      return null;
    } finally {
      setLoadingRole(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      fetchRoleProfile();
    } else {
      setRoleUser(null);
      setRole(null);
      setStatus(null);
      setLoadingRole(false);
    }
  }, [user, authLoading]);

  const syncUserRegistration = async (fullName) => {
    try {
      setLoadingRole(true);
      const response = await api.post('/users/register', { full_name: fullName });
      if (response.data) {
        setRoleUser(response.data);
        setRole(response.data.role);
        setStatus(response.data.status);
      }
      return response.data;
    } catch (err) {
      console.error('Error during MySQL registration sync:', err);
      throw err;
    } finally {
      setLoadingRole(false);
    }
  };

  const value = {
    roleUser,
    role,
    status,
    loadingRole: authLoading || loadingRole,
    syncUserRegistration,
    refreshRoleProfile: fetchRoleProfile,
    fetchRoleProfile
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};
