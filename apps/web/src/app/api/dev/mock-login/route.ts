/**
 * DEV ONLY — mock-login route.
 *
 * Calls Supabase password grant for the seeded dev user, lets the server-side
 * Supabase client write the auth cookies, then redirects to /projects.
 *
 * Only active when NEXT_PUBLIC_DEV_MOCK_AUTH=true. Disabled in production by
 * the guard below.
 */
import { createClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const MOCK_EMAIL = 'dev@zed.local';
const MOCK_PASSWORD = 'password123';

export async function GET(request: NextRequest) {
  // Hard-fail if anyone accidentally enables this in prod.
  if (process.env.NEXT_PUBLIC_DEV_MOCK_AUTH !== 'true') {
    return new NextResponse('Not found', { status: 404 });
  }

  const supabase = await createClient();

  let { data, error } = await supabase.auth.signInWithPassword({
    email: MOCK_EMAIL,
    password: MOCK_PASSWORD,
  });

  if (error || !data.session) {
    const fallback = await supabase.auth.signInWithPassword({
      email: 'dev@example.com',
      password: MOCK_PASSWORD,
    });
    if (fallback.data?.session) {
      data = fallback.data;
      error = null;
    }
  }

  if (error || !data.session) {
    console.error('[mock-login] Supabase sign-in failed:', error?.message ?? 'no session');
    return new NextResponse(
      `Mock login failed: ${error?.message ?? 'no session returned'}. ` +
      'Run: bun run src/seed-local-data.ts in apps/api to seed the dev user.',
      { status: 500 },
    );
  }

  // Where the user was trying to go before the redirect to /api/dev/mock-login
  const returnTo = request.nextUrl.searchParams.get('redirect') ?? '/projects';

  // The server-side createClient() already wrote the Supabase auth cookies via
  // the cookie store. Redirect directly to the destination.
  return NextResponse.redirect(new URL(returnTo, request.url));
}
