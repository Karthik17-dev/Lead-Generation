export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function GET() {
  return Response.json(
    {
      status: 'ok',
      service: 'web',
      version:
        process.env.ZED_PUBLIC_VERSION ||
        Reflect.get(process.env, 'NEXT_PUBLIC_ZED_VERSION') ||
        'unknown',
      commit: process.env.NEXT_PUBLIC_ZED_COMMIT || 'unknown',
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    },
  );
}
