'use client';

import type { ReactNode } from 'react';
import { ApplicationShell } from '../../components/shell/application-shell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <ApplicationShell scope="platform">{children}</ApplicationShell>;
}
