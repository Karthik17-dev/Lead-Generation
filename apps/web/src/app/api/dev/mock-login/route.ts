import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get('redirect') ?? '/projects';
  const res = NextResponse.redirect(new URL(returnTo, request.url));
  res.cookies.set('zed_mock_auth', '1', { path: '/', maxAge: 31536000 });
  res.cookies.set('sb-access-token', 'mock_dev_token', { path: '/', maxAge: 31536000 });
  return res;
}
