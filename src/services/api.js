import axios from 'axios';
import { Platform } from 'react-native';

// IP is read from .env — update EXPO_PUBLIC_API_IP when your network IP changes.
const LAN_IP = process.env.EXPO_PUBLIC_API_IP || '10.169.85.43';

const getBaseUrl = () => {
  if (Platform.OS === 'android' && !__DEV__) {
    return `http://${LAN_IP}:8000`;
  }
  return `http://${LAN_IP}:8000`;
};

const api = axios.create({
  baseURL: `${getBaseUrl()}/api/`,
  timeout: 10000,
});

// Simple memory-based token storage for the React Native prototype environment.
// In fully compiled production builds, this is replaced by secure storage (expo-secure-store).
let authToken = null;

// In-memory credential store for biometric re-authentication.
// Stores the last successfully authenticated user's credentials.
let storedCredentials = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const getAuthToken = () => {
  return authToken;
};

export const storeCredentials = (username, password) => {
  storedCredentials = { username, password };
};

export const getStoredCredentials = () => {
  return storedCredentials;
};

export const clearCredentials = () => {
  storedCredentials = null;
  authToken = null;
};

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
