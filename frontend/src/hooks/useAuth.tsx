"use client";

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  createContext, 
  useContext, 
  useMemo 
} from "react";
import type { User } from "@/types";
import { 
  getProfile, 
  loginUser, 
  signupUser, 
  logoutUser, 
  isAuthenticated 
} from "@/lib/auth";

/**
 * Shape of the authentication context state and methods.
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider component that wraps the app and manages global authentication state.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Track if we have a token locally to help reduce UI flickers
  const [hasLocalToken, setHasLocalToken] = useState<boolean>(false);

  const isMounted = React.useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * Fetches the latest user profile data from the API.
   */
  const refreshProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      if (isMounted.current) setUser(profile);
    } catch (err) {
      if (isMounted.current) {
        setUser(null);
        localStorage.removeItem("accessToken");
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  // Initial boot sequence
  useEffect(() => {
    const tokenExists = isAuthenticated();
    setHasLocalToken(tokenExists);

    if (tokenExists) {
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, [refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginUser(email, password);
    setUser(response.user);
    setHasLocalToken(true);
  }, []);

  const signup = useCallback(
    async (email: string, password: string, displayName: string) => {
      const response = await signupUser(email, password, displayName);
      setUser(response.user);
      setHasLocalToken(true);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setHasLocalToken(false);
    }
  }, []);

  /**
   * isLoggedIn is true if we have a user object, 
   * OR if we're still loading but we know a token exists (optimistic).
   */
  const isLoggedIn = useMemo(() => {
    return !!user || (loading && hasLocalToken);
  }, [user, loading, hasLocalToken]);

  const value = useMemo(() => ({
    user,
    loading,
    isLoggedIn,
    login,
    signup,
    logout,
    refreshProfile,
  }), [user, loading, isLoggedIn, login, signup, logout, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access authentication state and methods.
 * Must be used within an <AuthProvider>.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
