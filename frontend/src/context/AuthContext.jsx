import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import {
  login,
  register,
  logout,
  resetPassword
} from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("========== AuthProvider Started ==========");

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {

      console.log("====================================");
      console.log("Firebase auth state changed:");
      console.log(currentUser);

      setUser(currentUser);

      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();

          console.log("✅ User Logged In");
          console.log("UID:", currentUser.uid);
          console.log("Email:", currentUser.email);
          console.log("Display Name:", currentUser.displayName);
          console.log("Email Verified:", currentUser.emailVerified);
          console.log("Token acquired:", idToken.substring(0, 20) + "...");

          setToken(idToken);
        } catch (err) {
          console.error("❌ Failed to retrieve ID token:", err);
          setToken(null);
        }
      } else {
        console.warn("❌ User is NULL (Not Authenticated)");
        setToken(null);
      }

      setLoading(false);

      console.log("Loading:", false);
      console.log("====================================");
    });

    // Cleanup subscription
    return () => {
      console.log("AuthProvider Unmounted");
      unsubscribe();
    };
  }, []);

  const getIdToken = async (forceRefresh = false) => {
    try {
      if (!auth.currentUser) {
        console.warn("No authenticated Firebase user.");
        return null;
      }

      const idToken = await auth.currentUser.getIdToken(forceRefresh);

      console.log("Fresh Token Retrieved");

      setToken(idToken);

      return idToken;
    } catch (err) {
      console.error("Error getting ID token:", err);
      return null;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    resetPassword,
    getIdToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};