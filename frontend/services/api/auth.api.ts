import { apiClient } from './client';

export const authAPI = {
  login: async (email: string, password: string, role: string) => {
    const { data } = await apiClient.post(`/auth/${role}/login`, {
      email,
      password,
    });
    return data;
  },

  signup: async (userData: any, role: string) => {
    const { data } = await apiClient.post(`/auth/${role}/signup`, userData);
    return data;
  },

  verifyToken: async () => {
    const { data } = await apiClient.get('/auth/verify');
    return data;
  },
};