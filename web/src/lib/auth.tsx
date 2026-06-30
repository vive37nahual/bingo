"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiCall } from "./api";
import type { Permissions, User } from "./types";
import { DEFAULT_PERMISSIONS } from "./types";

interface AuthState {
  token: string | null;
  user: User | null;
  permissions: Permissions;
  isAdmin: boolean;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => void;
  updateUsername: (newUsername: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = "nahual_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] =
    useState<Permissions>(DEFAULT_PERMISSIONS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setToken(parsed.token);
        setUser(parsed.user);
        setPermissions(parsed.permissions || DEFAULT_PERMISSIONS);
        setIsAdmin(!!parsed.user?.admin);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const persist = useCallback(
    (data: {
      token: string;
      user: User;
      permissions: Permissions;
    }) => {
      setToken(data.token);
      setUser(data.user);
      setPermissions(data.permissions);
      setIsAdmin(!!data.user.admin);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
    []
  );

  const login = useCallback(
    async (loginId: string, password: string) => {
      const data = await apiCall<{
        token: string;
        user: User;
        permissions: Permissions;
      }>("login", { login: loginId, password });
      persist(data);
    },
    [persist]
  );

  const register = useCallback(async (formData: Record<string, string>) => {
    await apiCall("registerUser", formData);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setPermissions(DEFAULT_PERMISSIONS);
    setIsAdmin(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateUsername = useCallback(
    async (newUsername: string) => {
      if (!token || !user) throw new Error("No hay sesión activa");
      await apiCall("updateMyUsername", { newUsername }, token);
      const updatedUser = { ...user, user: newUsername };
      setUser(updatedUser);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.user = updatedUser;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    },
    [token, user]
  );

  const value = useMemo(
    () => ({
      token,
      user,
      permissions,
      isAdmin,
      isLoading,
      login,
      register,
      logout,
      updateUsername,
    }),
    [token, user, permissions, isAdmin, isLoading, login, register, logout, updateUsername]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
