'use client';

import { useEffect } from 'react';

export default function AuthPage() {
  useEffect(() => {
    document.cookie = 'zed_mock_auth=1; path=/; max-age=31536000';
    document.cookie = 'sb-access-token=mock_dev_token; path=/; max-age=31536000';
    try {
      localStorage.setItem('zed_mock_session', 'true');
    } catch {}
    window.location.replace('/projects');
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Entering Zed Workspace...</p>
      </div>
    </div>
  );
}
