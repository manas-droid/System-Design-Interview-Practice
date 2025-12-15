import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthResponse, User } from "./type"
import { useAuthToken } from "./useAuthToken";
import { api } from "../lib/api";


type SignupPayload = {
    email: string;
    password: string;
    handle: string;
    firstName: string;
    lastName: string;
}

type LoginPayload = {
    email: string;
    password: string;
}

type AuthContextValue = {
    user : User | null;
    isAuthenticated: boolean;
    loading: boolean;
    signup : (payload:SignupPayload) => Promise<void>;
    logout : () =>Promise<void>;
    login: (payload :  LoginPayload) => Promise<void>;

    getAccessToken: ()=>string | null;
    refreshAccessToken: () => Promise<string>;
}


const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider ({children} : {children: React.ReactNode}){
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

  
  const {accessToken,getAccessToken,setFromAuthResponse,refreshAccessToken,clearToken} = useAuthToken();

  const isAuthenticated = !!accessToken;

  async function signup(payload: SignupPayload) {
    const res = await api.post<AuthResponse>("/auth/signup", payload);
    setUser(res.data.user);
    setFromAuthResponse(res.data);
  }

    async function login(payload: { email: string; password: string }) {
        const res = await api.post<AuthResponse>("/auth/login", payload);
        setUser(res.data.user);
        setFromAuthResponse(res.data);
    }

    async function logout() {
        try {
        await api.post("/auth/logout");
        } finally {
        setUser(null);
        clearToken();
        }   
    }

    useEffect(() => {
        api.post<AuthResponse>("/auth/refresh")
        .then((output) =>{
          if (output.data.user) setUser(output.data.user);
          setFromAuthResponse(output.data);
        })
        .catch((_)=>{

          setUser(null);
          clearToken();

        }).finally(()=>{
          setLoading(false);
        });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      loading,
      signup,
      login,
      logout,
      getAccessToken,
      refreshAccessToken,
    }),
    [user, isAuthenticated, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>

}  

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

