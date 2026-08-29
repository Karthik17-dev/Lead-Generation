'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { setBootstrapAuthToken, setCachedAuthToken } from '@/lib/auth-token';
import { resetClientState } from '@/lib/utils/reset-client-state';
import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/storage/managed-storage';

const MOCK_DEV_USER: any = {
  id: '00000000-0000-0000-0000-000000000001',
  app_metadata: {},
  user_metadata: { name: 'Kortix Dev User', email: 'dev@zed.local' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'dev@zed.local',
};

type AuthContextType = {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(MOCK_DEV_USER);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setUser(MOCK_DEV_USER);
    setIsLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      supabase,
      session,
      user: user ?? MOCK_DEV_USER,
      isLoading: false,
      signOut,
    }),
    [supabase, session, user, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      supabase: createClient(),
      session: null,
      user: MOCK_DEV_USER as User,
      isLoading: false,
      signOut: async () => {},
    };
  }
  return context;
};
