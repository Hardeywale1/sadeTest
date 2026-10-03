import { apiClient, storage, TOKEN_KEYS } from './client';
import { AuthResponse, User, Session } from '../types';

export const authApi = {
  async signup(payload: {
    email: string;
    password: string;
    display_name: string;
    timezone?: string;
    account_type?: 'patient' | 'laboratory' | 'clinician';
    professional_title?: string;
    medical_license_number?: string;
    nin?: string;
    bvn?: string;
    license_document_url?: string;
    identity_document_url?: string;
  }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/v1/auth/signup', {
      timezone: 'Africa/Lagos',
      ...payload,
    });
    if (res.data.access_token) {
      await storage.setItem(TOKEN_KEYS.ACCESS_TOKEN, res.data.access_token);
      await storage.setItem(TOKEN_KEYS.REFRESH_TOKEN, res.data.refresh_token);
      await storage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/v1/auth/login', payload);
    if (res.data.access_token) {
      await storage.setItem(TOKEN_KEYS.ACCESS_TOKEN, res.data.access_token);
      await storage.setItem(TOKEN_KEYS.REFRESH_TOKEN, res.data.refresh_token);
      await storage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/v1/auth/logout');
    } finally {
      await storage.clearAuth();
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>('/v1/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token: string, new_password: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>('/v1/auth/reset-password', {
      token,
      new_password,
    });
    return res.data;
  },

  async changePassword(current_password: string, new_password: string): Promise<{ message: string }> {
    const res = await apiClient.patch<{ message: string }>('/v1/auth/password', {
      current_password,
      new_password,
    });
    return res.data;
  },

  async listSessions(): Promise<{ sessions: Session[] }> {
    const res = await apiClient.get<{ sessions: Session[] }>('/v1/auth/sessions');
    return res.data;
  },
};
