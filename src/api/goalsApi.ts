import { apiClient } from './client';
import { Goal } from '../types';

export const goalsApi = {
  async listPresets(interest_id?: string): Promise<{ goals: Goal[] }> {
    const query = interest_id ? `?interest_id=${interest_id}` : '';
    const res = await apiClient.get<{ goals: Goal[] }>(`/v1/me/goals/presets${query}`);
    return res.data;
  },

  async createGoal(payload: { interest_id: string; title: string; description?: string; target_value: number; unit: string }): Promise<Goal> {
    const res = await apiClient.post<Goal>('/v1/me/goals', payload);
    return res.data;
  },

  async assignPreset(preset_id: string): Promise<Goal> {
    const res = await apiClient.post<Goal>('/v1/me/goals/assign', { preset_id });
    return res.data;
  },

  async listMyGoals(): Promise<{ goals: Goal[] }> {
    const res = await apiClient.get<{ goals: Goal[] }>('/v1/me/goals');
    return res.data;
  },

  async updateProgress(goalId: string, current_value: number): Promise<Goal> {
    const res = await apiClient.patch<Goal>(`/v1/me/goals/${goalId}/progress`, { current_value });
    return res.data;
  },

  async archiveGoal(goalId: string): Promise<Goal> {
    const res = await apiClient.patch<Goal>(`/v1/me/goals/${goalId}/archive`);
    return res.data;
  },

  async deleteGoal(goalId: string): Promise<void> {
    await apiClient.delete(`/v1/me/goals/${goalId}`);
  },
};
