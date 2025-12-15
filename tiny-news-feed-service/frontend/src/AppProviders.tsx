import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { setupInterceptors } from "./auth/setUpInterceptors";

function InterceptorBootstrap({ children }: { children: React.ReactNode }) {
  const { getAccessToken, refreshAccessToken, logout } = useAuth();

  useEffect(() => {
    setupInterceptors({
      getAccessToken,
      refreshAccessToken,
      onLogout: logout,
    });
    // NOTE: only set up once; accessToken is read via closure here.
    // If you prefer not to rely on closure, store token in a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <InterceptorBootstrap>{children}</InterceptorBootstrap>
    </AuthProvider>
  );
}
