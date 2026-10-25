import { apiClient, storage, TOKEN_KEYS } from './client';
import { AuthResponse, User, Session, ClinicianSettings, SubscriptionPlan, DemoRole } from '../types';

const saveAuth = async (response: AuthResponse) => {
  if (!response.access_token) return;
  await storage.setItem(TOKEN_KEYS.ACCESS_TOKEN, response.access_token);
  await storage.setItem(TOKEN_KEYS.REFRESH_TOKEN, response.refresh_token);
  await storage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(response.user));
};

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
    clinician_settings?: ClinicianSettings;
    plan?: SubscriptionPlan;
  }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/v1/auth/signup', {
      timezone: 'Africa/Lagos',
      ...payload,
    });
    await saveAuth(res.data);
    return res.data;
  },

  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/v1/auth/login', payload);
    await saveAuth(res.data);
    return res.data;
  },

  async demoLogin(role: DemoRole): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/v1/auth/demo', { role });
    await saveAuth(res.data);
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
