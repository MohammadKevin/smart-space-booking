"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile, getProfile } from "./api";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginUser: (token: string, user: UserProfile, rememberMe?: boolean) => void;
  logoutUser: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const storedToken =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("access_token");

      if (storedToken) {
        setToken(storedToken);
        const profile = await getProfile();
        setUser(profile);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedToken =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {}
      }

      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 3500);

      refreshUser().finally(() => clearTimeout(timeout));
    } else {
      setIsLoading(false);
    }
  }, []);

  const loginUser = (newToken: string, newUser: UserProfile, rememberMe: boolean = true) => {
    setToken(newToken);
    setUser(newUser);

    if (rememberMe) {
      localStorage.setItem("token", newToken);
      localStorage.setItem("access_token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("user");
    } else {
      sessionStorage.setItem("token", newToken);
      sessionStorage.setItem("access_token", newToken);
      sessionStorage.setItem("user", JSON.stringify(newUser));
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
    }
  };

  const logoutUser = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        loginUser,
        logoutUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
