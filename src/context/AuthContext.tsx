"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
  fetchCurrentUser,
  clearToken,
  type PhpUser,
} from "@/lib/api";

// ── Types ──────────────────────────────────────────────

interface AuthContextValue {
  /** The logged-in user, or null if not authenticated */
  user: PhpUser | null;
  /** True while checking existing token on initial load */
  loading: boolean;
  /** Log in with email + password */
  login: (email: string, password: string) => Promise<void>;
  /** Create an account and log in */
  signup: (email: string, password: string, name?: string) => Promise<void>;
  /** Log out and clear session */
  logout: () => Promise<void>;
  /** Refresh user data from the server (e.g. after tier change) */
  refreshUser: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Hook ───────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

// ── Provider ───────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PhpUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on mount ───────────────────────
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const currentUser = await fetchCurrentUser();
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        if (!cancelled) {
          clearToken();
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Login ─────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    setUser(result.user);
  }, []);

  // ── Signup ────────────────────────────────────────
  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      const result = await apiSignup(email, password, name);
      setUser(result.user);
    },
    []
  );

  // ── Logout ────────────────────────────────────────
  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  // ── Refresh ───────────────────────────────────────
  const refreshUser = useCallback(async () => {
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
