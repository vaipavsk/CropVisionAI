import axios from 'axios';
import { auth } from '../firebase/firebase';

export const AI_API_BASE_URL =
  import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8000';

const aiApi = axios.create({
  baseURL: AI_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// The AI upload and prediction routes require the same Firebase token as the
// user backend, while retaining their own service base URL.
aiApi.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // Continue without a token; the service returns its standard auth error.
  }
  return config;
});

export default aiApi;
