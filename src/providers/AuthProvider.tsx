'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const LOGGED_OUT_KEY = 'logged_out';

export function clearLoggedOutFlag() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOGGED_OUT_KEY);
  }
}

type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Directly fetch /users/me without going through apiClient.
 * This avoids the 401 → refresh → redirect loop that apiClient triggers
 * when the user is not authenticated.
 */
async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${BASE_URL}/users/me`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (body.success && body.data) {
      return {
        id: body.data.id,
        email: body.data.email,
        name: body.data.name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
  }, []);

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined' && localStorage.getItem(LOGGED_OUT_KEY)) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const me = await fetchMe();
      setUser(me);
      setIsLoading(false);
    };
    init();
  }, []);

  const logout = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOGGED_OUT_KEY, '1');
    }
    try {
      await fetch(`${BASE_URL}/sessions`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      // Continue with local cleanup even if server call fails
    }
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        setUser,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
