import api, { saveAuthTokens, clearAuthTokens } from '@/lib/api';
import type { AuthUser } from '@/store/auth.store';

interface ApiUser {
  id: string; email: string; firstName: string; lastName: string;
  role: string; phone?: string; avatarUrl?: string;
}
interface AuthResponse {
  user: ApiUser;
  tokens: { accessToken: string; refreshToken: string; expiresIn: number };
}

function mapUser(u: ApiUser): AuthUser {
  return { ...u, name: `${u.firstName} ${u.lastName}`.trim() };
}

export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    api.post<{ data: AuthResponse }>('/auth/register', data).then(r => {
      const { tokens, user } = r.data.data;
      saveAuthTokens(tokens.accessToken, tokens.refreshToken);
      return { tokens, user: mapUser(user) };
    }),

  login: (email: string, password: string) =>
    api.post<{ data: AuthResponse }>('/auth/login', { email, password }).then(r => {
      const { tokens, user } = r.data.data;
      saveAuthTokens(tokens.accessToken, tokens.refreshToken);
      return { tokens, user: mapUser(user) };
    }),

  logout: () =>
    api.post('/auth/logout').finally(() => clearAuthTokens()),

  getMe: () =>
    api.get<{ data: ApiUser }>('/users/me').then(r => mapUser(r.data.data)),

  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string }) =>
    api.patch<{ data: ApiUser }>('/users/me', data).then(r => mapUser(r.data.data)),

  getAddresses: () =>
    api.get('/users/me/addresses').then(r => r.data.data),

  addAddress: (data: Record<string, unknown>) =>
    api.post('/users/me/addresses', data).then(r => r.data.data),

  updateAddress: (id: string, data: Record<string, unknown>) =>
    api.patch(`/users/me/addresses/${id}`, data).then(r => r.data.data),

  removeAddress: (id: string) =>
    api.delete(`/users/me/addresses/${id}`),
};
