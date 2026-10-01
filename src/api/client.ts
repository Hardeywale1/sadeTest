declare const process: { env: { [key: string]: string | undefined } };

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API URL configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'sade_access_token',
  REFRESH_TOKEN: 'sade_refresh_token',
  USER_DATA: 'sade_user_data',
};

// Cross-platform storage helpers
export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('Storage setItem failed:', e);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage removeItem failed:', e);
    }
  },
  async clearAuth(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    await AsyncStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(TOKEN_KEYS.USER_DATA);
  },
};

// Create main Axios Client
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto-Refresh JWT on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = ['/v1/auth/login', '/v1/auth/signup', '/v1/auth/refresh'].some(
      (path) => originalRequest?.url?.includes(path)
    );

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          await storage.clearAuth();
          return Promise.reject(error);
        }

        const res = await axios.post(`${API_BASE_URL}/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = res.data;
        await storage.setItem(TOKEN_KEYS.ACCESS_TOKEN, access_token);
        if (newRefreshToken) {
          await storage.setItem(TOKEN_KEYS.REFRESH_TOKEN, newRefreshToken);
        }

        processQueue(null, access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await storage.clearAuth();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
