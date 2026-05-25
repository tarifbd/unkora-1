import axios, { type AxiosInstance, type AxiosError } from 'axios';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

function drainQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

// Response interceptor — 401 refresh with queue to prevent race conditions
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Network / timeout errors
    if (!error.response) {
      return Promise.reject(new Error('Network error — please check your connection'));
    }

    // Auth endpoints (login, register, refresh) should never trigger a token refresh retry
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

    if (error.response.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (!refreshToken) {
        clearAuthTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken }, { timeout: 10_000 });
        const { accessToken, refreshToken: newRefresh } = data.data as { accessToken: string; refreshToken: string };
        saveAuthTokens(accessToken, newRefresh);
        drainQueue(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        clearAuthTokens();
        refreshQueue = [];
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export function saveAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  const accessExp = new Date(Date.now() + 15 * 60 * 1000).toUTCString();
  const refreshExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `access_token=${accessToken}; path=/; expires=${accessExp}; SameSite=Lax`;
  document.cookie = `refresh_token=${refreshToken}; path=/; expires=${refreshExp}; SameSite=Lax`;
}

export function saveUserRole(role: string) {
  const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `user_role=${role}; path=/; expires=${exp}; SameSite=Lax`;
}

export function clearAuthTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

export default apiClient;
