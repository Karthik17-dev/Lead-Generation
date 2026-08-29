'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectStartPage() {
  const router = useRouter();

  useEffect(() => {
    // Directly enter the default workspace without calling GitHub repo creation
    router.replace('/projects/default');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading Kortix Workspace...</p>
      </div>
    </div>
  );
}
