import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { api } from "../lib/api";

export function setupInterceptors({
  getAccessToken,
  refreshAccessToken,
  onLogout,
}: {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string>;
  onLogout: () => void | Promise<void>;
}) {
  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  let refreshPromise: Promise<string> | null = null;

  api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (original?.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;


      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newToken}`;

      return api(original);
    } catch (e) {
      await onLogout();
      return Promise.reject(e);
    }
  }
);



}
