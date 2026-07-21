import axios from 'axios';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  // Graceful fallback or warning if VITE_API_BASE_URL is not set
  console.warn('VITE_API_BASE_URL is not configured in env parameters.');
}

export const api = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Firebase ID Token
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (err) {
      // Continue without token if retrieval fails
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized errors gracefully
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Do not force logout/redirect for registration or initial me check endpoints
    const isAuthCheckOrRegister = originalRequest?.url?.includes('/users/me') || originalRequest?.url?.includes('/users/register');
    const skipRedirect = originalRequest?._skip401Redirect;

    if (error.response && error.response.status === 401 && !isAuthCheckOrRegister && !skipRedirect) {
      console.warn('Unauthorized request detected. Session expired.');
      try {
        await signOut(auth);
      } catch (signoutErr) {
        console.error('Signout error:', signoutErr);
      }
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Reusable API error parser
 * @param {Error} error 
 * @returns {Promise<never>}
 */
export const handleApiError = (error) => {
  let errorMessage = 'An unexpected system error occurred.';
  
  if (error.response) {
    // Backend returned an error response
    errorMessage = error.response.data?.message || 
                   error.response.data?.detail || 
                   (typeof error.response.data === 'string' ? error.response.data : null) ||
                   `Request failed with status ${error.response.status}`;
  } else if (error.request) {
    // Request was made but no response received (network error)
    errorMessage = 'Gateway unreachable. Please check your internet connection or backend server status.';
  } else {
    // Error setting up the request
    errorMessage = error.message;
  }
  
  return Promise.reject(new Error(errorMessage));
};

export default api;
