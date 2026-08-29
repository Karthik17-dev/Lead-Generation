'use client';

import React, { type ReactNode } from 'react';

export function ProjectAccessBoundary({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  // Always allow access to workspace without GitHub repo creation or API errors
  return <>{children}</>;
}
