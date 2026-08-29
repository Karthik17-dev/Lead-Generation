import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { ZED_SUPABASE_AUTH_COOKIE } from './constants'
import { getEnv } from '@/lib/env-config'

const MOCK_DEV_USER: any = {
  id: '00000000-0000-0000-0000-000000000001',
  app_metadata: {},
  user_metadata: { name: 'Zed Admin', email: 'dev@zed.local' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'dev@zed.local',
};

function resolveBrowserSupabaseUrl(url?: string): string {
  if (!url) return 'http://127.0.0.1:54321';
  if (url.startsWith('/') && typeof window !== 'undefined') {
    return new URL(url, window.location.origin).toString().replace(/\/$/, '')
  }
  return url
}

export async function fetchSamlEnabled(): Promise<boolean> {
  return false;
}

export function createClient() {
  const runtimeEnv = getEnv()
  const url = resolveBrowserSupabaseUrl(runtimeEnv?.SUPABASE_URL || 'http://127.0.0.1:54321')
  const key = runtimeEnv?.SUPABASE_ANON_KEY || 'mock_anon_key'

  const client = createBrowserClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    cookieOptions: {
      name: ZED_SUPABASE_AUTH_COOKIE,
      path: '/',
      sameSite: 'lax',
    },
  });

  // Patch client methods to never throw AuthRetryableFetchError when offline
  client.auth.getUser = async () => {
    return { data: { user: MOCK_DEV_USER }, error: null };
  };

  client.auth.getSession = async () => {
    return {
      data: {
        session: {
          access_token: 'mock_token',
          refresh_token: 'mock_refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: MOCK_DEV_USER,
        } as any,
      },
      error: null,
    };
  };

  return client;
}

export function createEphemeralOAuthClient() {
  return createClient() as any;
}
