import { apiClient } from './client';

export type PaystackCheckout = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export const paymentsApi = {
  async initializePaystack(): Promise<PaystackCheckout> {
    const response = await apiClient.post<PaystackCheckout>('/v1/me/payments/paystack/initialize');
    return response.data;
  },
};
