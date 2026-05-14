import api, { saveAuthTokens, clearAuthTokens } from '@/lib/api';

export interface AuthUser {
  id: string; email: string; name: string; role: string; phone?: string; avatar?: string;
}
export interface AuthResponse {
  user: AuthUser;
  tokens: { accessToken: string; refreshToken: string; expiresIn: number };
}

export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    api.post<{ data: AuthResponse }>('/auth/register', data).then(r => {
      const { tokens } = r.data.data;
      saveAuthTokens(tokens.accessToken, tokens.refreshToken);
      return r.data.data;
    }),

  login: (email: string, password: string) =>
    api.post<{ data: AuthResponse }>('/auth/login', { email, password }).then(r => {
      const { tokens } = r.data.data;
      saveAuthTokens(tokens.accessToken, tokens.refreshToken);
      return r.data.data;
    }),

  logout: () =>
    api.post('/auth/logout').finally(() => clearAuthTokens()),

  getMe: () =>
    api.get<{ data: AuthUser }>('/users/me').then(r => r.data.data),

  updateProfile: (data: { name?: string; phone?: string }) =>
    api.patch<{ data: AuthUser }>('/users/me', data).then(r => r.data.data),

  getAddresses: () =>
    api.get('/users/me/addresses').then(r => r.data.data),

  addAddress: (data: Record<string, unknown>) =>
    api.post('/users/me/addresses', data).then(r => r.data.data),

  updateAddress: (id: string, data: Record<string, unknown>) =>
    api.patch(`/users/me/addresses/${id}`, data).then(r => r.data.data),

  removeAddress: (id: string) =>
    api.delete(`/users/me/addresses/${id}`),
};
