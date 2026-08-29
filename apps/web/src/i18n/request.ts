import { getServerPublicEnv } from '@/lib/public-env-server';
import { ZED_SUPABASE_AUTH_COOKIE } from '@/lib/supabase/constants';
import { createServerClient } from '@supabase/ssr';
import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, type Locale } from './config';
import { getUserLocale, normalizeLocale } from './locale';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale: Locale = defaultLocale;
  const cookieStore = await cookies();
  const headersList = await headers();

  // Priority 1: User profile locale preference (mock dev mode uses defaultLocale without remote auth fetch)
  // This avoids offline AuthRetryableFetchError when local Supabase port 54321 is not running.

  // Priority 2: If locale is provided in the URL path (e.g., /de, /it), use it for marketing pages
  // This allows SEO-friendly URLs like /de, /it for marketing content
  const urlLocale = normalizeLocale((await requestLocale) || headersList.get('x-locale'));
  if (urlLocale) {
    locale = urlLocale;
    return {
      locale,
      messages: (await import(`../../translations/${locale}.json`)).default,
    };
  }

  // Priority 3: Default to English. Browser headers, timezones, cookies, and
  // localStorage never change the language automatically.
  return {
    locale,
    messages: (await import(`../../translations/${locale}.json`)).default,
  };
});
