import { apiClient } from './client';
import { Subscription } from '../types';

export type PaystackCheckout = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export const paymentsApi = {
  async initializePaystack(): Promise<PaystackCheckout> {
    const callback_url = typeof window !== 'undefined' ? `${window.location.origin}/payment/callback` : undefined;
    const response = await apiClient.post<PaystackCheckout>('/v1/me/payments/paystack/initialize', { callback_url });
    return response.data;
  },

  async verifyPaystack(reference: string): Promise<{ status: 'success' | 'failed'; message?: string; subscription?: Subscription }> {
    const response = await apiClient.post('/v1/me/payments/paystack/verify', { reference });
    return response.data;
  },
};
