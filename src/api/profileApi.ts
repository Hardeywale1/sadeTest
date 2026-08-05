import { apiClient } from './client';
import { InterestCategory, OnboardingResponse, Profile, Questionnaire } from '../types';

export const profileApi = {
  async getProfile(): Promise<Profile> {
    const res = await apiClient.get<Profile>('/v1/me/profile');
    return res.data;
  },

  async updateProfile(patch: Partial<Profile>): Promise<Profile> {
    const res = await apiClient.patch<Profile>('/v1/me/profile', patch);
    return res.data;
  },
};

export const onboardingApi = {
  async getQuestionnaire(): Promise<Questionnaire> {
    const res = await apiClient.get<Questionnaire>('/v1/onboarding/questionnaire');
    return res.data;
  },

  async getOnboarding(): Promise<OnboardingResponse> {
    const res = await apiClient.get<OnboardingResponse>('/v1/me/onboarding');
    return res.data;
  },

  async saveOnboarding(is_complete: boolean, payload: Record<string, any>): Promise<OnboardingResponse> {
    const res = await apiClient.put<OnboardingResponse>('/v1/me/onboarding', { is_complete, payload });
    return res.data;
  },
};

export const interestsApi = {
  async getCatalog(): Promise<InterestCategory[]> {
    const res = await apiClient.get<{ categories: InterestCategory[] }>('/v1/interests/catalog');
    return res.data.categories;
  },

  async replaceSelection(category_ids: string[]): Promise<string[]> {
    const res = await apiClient.put<{ category_ids: string[] }>('/v1/me/interests', { category_ids });
    return res.data.category_ids;
  },

  async getSelection(): Promise<string[]> {
    const res = await apiClient.get<{ category_ids: string[] }>('/v1/me/interests');
    return res.data.category_ids || [];
  },
};
