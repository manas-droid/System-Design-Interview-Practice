import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { AuthResponse } from "./type";

const REFRESH_BUFFER_MS = 30_000; // refresh 30s before expiry

const refreshTokenFallBackMS:number = 15*60 * 1000;
const durationToMs = (value: string | undefined, fallbackMs: number) => {
  
  if (!value) {
    return fallbackMs
  }

  const match = value.trim().match(/^(\d+)([smhd])$/i)
  if (!match) {
    return fallbackMs
  }

  const amount = parseInt(match[1], 10)
  const unit = match[2].toLowerCase()
  const unitMap: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  return amount * (unitMap[unit] ?? 1000)
}




export function useAuthToken() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const expiryRef = useRef<number | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);

  /* ---------------------------------- */
  /* Helpers                             */
  /* ---------------------------------- */

  const clearRefreshTimer = () => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  };

  const clearToken = useCallback(() => {
    clearRefreshTimer();
    expiryRef.current = null;
    setAccessToken(null);
  }, []);

  const scheduleRefresh = useCallback((expiresInSeconds: number) => {
    clearRefreshTimer();
    const expiryTime = Date.now() + expiresInSeconds * 1000;

    expiryRef.current = expiryTime;

    const timeout = expiryTime - Date.now() - REFRESH_BUFFER_MS;

    if (timeout <= 0) return;

    refreshTimeoutRef.current = window.setTimeout(() => {
      refreshAccessToken().catch(clearToken);
    }, timeout);
  }, []);

  /* ---------------------------------- */
  /* Apply tokens from backend response */
  /* ---------------------------------- */

  const setFromAuthResponse = useCallback((res: AuthResponse) => {
    setAccessToken(res.accessToken);
    scheduleRefresh(durationToMs(res.expiresIn, refreshTokenFallBackMS));
  }, [scheduleRefresh]);

  /* ---------------------------------- */
  /* Refresh access token               */
  /* ---------------------------------- */

  const refreshAccessToken = useCallback(async (): Promise<string> => {
    const res = await api.post<AuthResponse>("/auth/refresh");
    setAccessToken(res.data.accessToken);
    scheduleRefresh(durationToMs(res.data.expiresIn , refreshTokenFallBackMS));
    return res.data.accessToken;
  }, [scheduleRefresh]);

  /* ---------------------------------- */
  /* Public accessor                    */
  /* ---------------------------------- */

  const getAccessToken = useCallback(() => accessToken, [accessToken]);

  /* ---------------------------------- */
  /* Cleanup on unmount                 */
  /* ---------------------------------- */

  useEffect(() => {
    return () => clearRefreshTimer();
  }, []);

  return {
    accessToken,
    getAccessToken,
    setFromAuthResponse,
    refreshAccessToken,
    clearToken,
  };
}
