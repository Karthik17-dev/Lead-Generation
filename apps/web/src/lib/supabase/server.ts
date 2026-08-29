'use server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ZED_SUPABASE_AUTH_COOKIE } from './constants'

const MOCK_DEV_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  app_metadata: {},
  user_metadata: { name: 'Zed Admin', email: 'dev@zed.local' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'dev@zed.local',
};

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl =
    process.env.SUPABASE_SERVER_URL ||
    process.env.SUPABASE_URL ||
    process.env.ZED_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'http://127.0.0.1:54321';
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.ZED_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'mock_anon_key';

  const client = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
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
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  );

  // Return mock user and session immediately without network calls
  client.auth.getUser = async () => {
    return { data: { user: MOCK_DEV_USER as any }, error: null };
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
