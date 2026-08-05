import { apiClient } from './client';
import { JournalEntry } from '../types';

export const journalApi = {
  async createEntry(payload: { title?: string; body: string; mood?: string; tags?: string[] }): Promise<JournalEntry> {
    const res = await apiClient.post<JournalEntry>('/v1/me/journal', payload);
    return res.data;
  },

  async listEntries(limit = 50): Promise<{ entries: JournalEntry[] }> {
    const res = await apiClient.get<{ entries: JournalEntry[] }>(`/v1/me/journal?limit=${limit}`);
    return res.data;
  },

  async getEntry(id: string): Promise<JournalEntry> {
    const res = await apiClient.get<JournalEntry>(`/v1/me/journal/${id}`);
    return res.data;
  },

  async updateEntry(id: string, payload: Partial<JournalEntry>): Promise<JournalEntry> {
    const res = await apiClient.patch<JournalEntry>(`/v1/me/journal/${id}`, payload);
    return res.data;
  },

  async deleteEntry(id: string): Promise<void> {
    await apiClient.delete(`/v1/me/journal/${id}`);
  },
};
