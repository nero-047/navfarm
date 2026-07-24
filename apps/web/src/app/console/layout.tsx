'use client';

import type { ReactNode } from 'react';
import { ApplicationShell } from '../../components/shell/application-shell';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <ApplicationShell scope="tenant">{children}</ApplicationShell>;
}
