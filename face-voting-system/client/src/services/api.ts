import axios from 'axios';
import type { RegisterRequest, LoginRequest, AuthResponse, Party, User, Vote, VerificationSessionResponse, CompleteVerificationResponse, PartyWithVotes } from '@shared/index';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: RegisterRequest, photo: File, embedding?: string) => {
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('username', data.username);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('confirmPassword', data.confirmPassword);
    formData.append('photo', photo);
    if (embedding) {
      formData.append('faceEmbedding', embedding);
    }
    return api.post<{ message: string; userId: string }>('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  verifyEmail: (token: string) =>
    api.get('/auth/verify-email', { params: { token } }),

  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get<{ user: User }>('/auth/me'),
};

export const partyApi = {
  getAll: () =>
    api.get<{ parties: Party[] }>('/parties'),

  getById: (id: string) =>
    api.get<{ party: Party }>(`/parties/${id}`),
};

export const voteApi = {
  getStatus: () =>
    api.get<{ hasVoted: boolean }>('/votes/status'),

  createSession: (partyId: string) =>
    api.post<VerificationSessionResponse>('/votes/session', { partyId }),

  completeVerification: (sessionId: string, matchScore: number, challengesPassed: string[]) =>
    api.post<CompleteVerificationResponse>(`/votes/session/${sessionId}/complete`, {
      matchScore,
      challengesPassed,
    }),

  submitVote: (sessionToken: string) =>
    api.post<{ message: string; party: string; timestamp: string }>('/votes', { sessionToken }),
};

export const adminApi = {
  login: (username: string, password: string) =>
    api.post<AuthResponse>('/admin/auth/login', { username, password }),

  getParties: () =>
    api.get<{ parties: PartyWithVotes[] }>('/admin/parties'),

  createParty: (data: { name: string; logoPath?: string | null }) =>
    api.post<{ party: Party }>('/admin/parties', data),

  updateParty: (id: string, data: { name: string; logoPath?: string | null }) =>
    api.put<{ party: Party }>(`/admin/parties/${id}`, data),

  deleteParty: (id: string) =>
    api.delete(`/admin/parties/${id}`),

  getResults: () =>
    api.get<{ totalVotes: number; results: Array<{ id: string; name: string; logoPath: string | null; votes: number; percentage: string }> }>('/admin/results'),
};

export default api;