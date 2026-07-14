"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { authApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: string;
  plan: string;
  affiliateCode?: string;
}

/* eslint-disable no-unused-vars */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => Promise<void>;
}
/* eslint-enable no-unused-vars */


const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("ncn_user");
    const token = localStorage.getItem("ncn_access_token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      // Verify token is still valid
      authApi.me()
        .then((u) => { setUser(u); localStorage.setItem("ncn_user", JSON.stringify(u)); })
        .catch(() => {
          localStorage.removeItem("ncn_user");
          localStorage.removeItem("ncn_access_token");
          localStorage.removeItem("ncn_refresh_token");
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem("ncn_access_token", data.accessToken);
    localStorage.setItem("ncn_refresh_token", data.refreshToken);
    localStorage.setItem("ncn_user", JSON.stringify(data.user));
    // Set cookies for middleware detection
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    const cookieFlags = `path=/; max-age=2592000; SameSite=Lax${isSecure ? "; Secure" : ""}`;
    document.cookie = `ncn_auth=1; ${cookieFlags}`;
    document.cookie = `ncn_role=${data.user.role}; ${cookieFlags}`;
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, referralCode?: string) => {
    const data = await authApi.register({ name, email, password, referralCode });
    localStorage.setItem("ncn_access_token", data.accessToken);
    localStorage.setItem("ncn_refresh_token", data.refreshToken);
    localStorage.setItem("ncn_user", JSON.stringify(data.user));
    // Set cookies for middleware detection
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    const cookieFlags = `path=/; max-age=2592000; SameSite=Lax${isSecure ? "; Secure" : ""}`;
    document.cookie = `ncn_auth=1; ${cookieFlags}`;
    document.cookie = `ncn_role=${data.user.role}; ${cookieFlags}`;
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem("ncn_access_token");
    localStorage.removeItem("ncn_refresh_token");
    localStorage.removeItem("ncn_user");
    // Clear auth cookies so middleware stops treating user as authenticated
    document.cookie = "ncn_auth=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "ncn_role=; path=/; max-age=0; SameSite=Lax";
    setUser(null);
    toast({ title: "Đã đăng xuất", description: "Hẹn gặp lại bạn!" });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
