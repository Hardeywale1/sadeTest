import { apiClient } from './client';
import { Post, Comment, Clan, ClanMember, Gossip, Article } from '../types';

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

  /** Likes a post and returns the updated post (idempotent server-side). */
  async likePost(postId: string): Promise<Post> {
    const res = await apiClient.post<Post>(`/v1/posts/${postId}/like`);
    return res.data;
  },

  /** Removes a like and returns the updated post (idempotent server-side). */
  async unlikePost(postId: string): Promise<Post> {
    const res = await apiClient.delete<Post>(`/v1/posts/${postId}/like`);
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
