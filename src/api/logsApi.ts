import { apiClient } from './client';
import {
  Log,
  LogSummary,
  Goal,
  JournalEntry,
  Post,
  Comment,
  Clan,
  ClanMember,
  Gossip,
  Article,
} from '../types';

export const logsApi = {
  async createLog(payload: { interest_id: string; date?: string; payload: Record<string, any>; note?: string }): Promise<Log> {
    const res = await apiClient.post<Log>('/v1/me/logs', payload);
    return res.data;
  },

  async listLogs(interest_id?: string, limit = 50): Promise<{ logs: Log[] }> {
    const params = new URLSearchParams();
    if (interest_id) params.append('interest_id', interest_id);
    params.append('limit', limit.toString());
    const res = await apiClient.get<{ logs: Log[] }>(`/v1/me/logs?${params.toString()}`);
    return res.data;
  },

  async getLog(id: string): Promise<Log> {
    const res = await apiClient.get<Log>(`/v1/me/logs/${id}`);
    return res.data;
  },

  async updateLog(id: string, payload: { payload?: Record<string, any>; note?: string }): Promise<Log> {
    const res = await apiClient.patch<Log>(`/v1/me/logs/${id}`, payload);
    return res.data;
  },

  async getSummary(interest_id?: string, days = 30): Promise<LogSummary> {
    const params = new URLSearchParams();
    if (interest_id) params.append('interest_id', interest_id);
    params.append('days', days.toString());
    const res = await apiClient.get<LogSummary>(`/v1/me/logs/summary?${params.toString()}`);
    return res.data;
  },

  async deleteLog(id: string): Promise<void> {
    await apiClient.delete(`/v1/me/logs/${id}`);
  },
};

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

export const communityApi = {
  async listPosts(interest_id?: string, limit = 20): Promise<{ posts: Post[] }> {
    const query = interest_id ? `?interest_id=${interest_id}&limit=${limit}` : `?limit=${limit}`;
    const res = await apiClient.get<{ posts: Post[] }>(`/v1/posts${query}`);
    return res.data;
  },

  async createPost(payload: { title: string; body: string; interest_ids: string[]; is_anonymous?: boolean }): Promise<Post> {
    const res = await apiClient.post<Post>('/v1/posts', payload);
    return res.data;
  },

  async getPost(postId: string): Promise<Post> {
    const res = await apiClient.get<Post>(`/v1/posts/${postId}`);
    return res.data;
  },

  async addComment(postId: string, body: string): Promise<Comment> {
    const res = await apiClient.post<Comment>(`/v1/posts/${postId}/comments`, { body });
    return res.data;
  },

  async listComments(postId: string): Promise<{ comments: Comment[] }> {
    const res = await apiClient.get<{ comments: Comment[] }>(`/v1/posts/${postId}/comments`);
    return res.data;
  },

  async listGossips(): Promise<{ gossips: Gossip[] }> {
    const res = await apiClient.get<{ gossips: Gossip[] }>('/api/v1/gossips');
    return res.data;
  },

  async listArticles(): Promise<{ articles: Article[] }> {
    const res = await apiClient.get<{ articles: Article[] }>('/api/v1/articles');
    return res.data;
  },

  async getArticle(id: string): Promise<Article> {
    const res = await apiClient.get<Article>(`/api/v1/articles/${id}`);
    return res.data;
  },

  // Clans
  async createClan(payload: { name: string; description?: string; focus?: string; interest_ids?: string[]; is_private?: boolean }): Promise<Clan> {
    const res = await apiClient.post<Clan>('/v1/clans', payload);
    return res.data;
  },

  async listClans(): Promise<{ clans: Clan[] }> {
    const res = await apiClient.get<{ clans: Clan[] }>('/v1/clans');
    return res.data;
  },

  async listMyClans(): Promise<{ clans: Clan[] }> {
    const res = await apiClient.get<{ clans: Clan[] }>('/v1/me/clans');
    return res.data;
  },

  async getClan(clanId: string): Promise<Clan> {
    const res = await apiClient.get<Clan>(`/v1/clans/${clanId}`);
    return res.data;
  },

  async joinClan(clanId: string): Promise<{ status: string }> {
    const res = await apiClient.post<{ status: string }>(`/v1/clans/${clanId}/join`);
    return res.data;
  },

  async leaveClan(clanId: string): Promise<{ status: string }> {
    const res = await apiClient.post<{ status: string }>(`/v1/clans/${clanId}/leave`);
    return res.data;
  },

  async listClanMembers(clanId: string): Promise<{ members: ClanMember[] }> {
    const res = await apiClient.get<{ members: ClanMember[] }>(`/v1/clans/${clanId}/members`);
    return res.data;
  },
};
