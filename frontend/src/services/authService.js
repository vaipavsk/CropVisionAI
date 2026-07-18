import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

/**
 * Registers a new user with email and password.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export const register = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Logs in an existing user with email and password.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export const login = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Logs out the current user.
 * @returns {Promise<void>}
 */
export const logout = () => {
  return signOut(auth);
};

/**
 * Sends a password reset email.
 * @param {string} email 
 * @returns {Promise<void>}
 */
export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};

const authService = {
  register,
  login,
  logout,
  resetPassword
};

export default authService;
