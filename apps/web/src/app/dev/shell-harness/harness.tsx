"use client";

import { useState } from "react";
import { Boxes, Database, Landmark, LayoutDashboard, Sprout, Users } from "lucide-react";
import { AppShell } from "../../../components/shell/AppShell";
import { Dialog } from "../../../components/ui/dialog";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dev/shell-harness", icon: LayoutDashboard },
  { label: "Master Data", href: "/dev/shell-harness/master-data", icon: Database },
  { label: "Inventory", href: "/dev/shell-harness/inventory", icon: Boxes },
  { label: "Finance", href: "/dev/shell-harness/finance", icon: Landmark },
  { label: "Production", href: "/dev/shell-harness/production", icon: Sprout },
  { label: "Team Management", href: "/dev/shell-harness/users", icon: Users },
];

/** Long enough that the column must scroll on its own at every test viewport. */
const CONTEXT_ITEMS = Array.from({ length: 40 }, (_, i) => `Context entry ${i + 1}`);

/** Long enough that the content region must scroll on its own. */
const CONTENT_ROWS = Array.from({ length: 60 }, (_, i) => i + 1);

export function ShellHarness({ withContextNav }: { withContextNav: boolean }) {
  // The other half of the overlay taxonomy. The fixture carries a Dialog so the
  // browser suite can prove the distinction Phase 2 rests on: a popover leaves
  // the page live, a dialog blocks it and takes the shared scroll lock.
  const [dialogOpen, setDialogOpen] = useState(false);

  const contextNav = (
    <div className="p-3" data-testid="harness-context-nav">
      <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">Section</p>
      <ul className="space-y-0.5">
        {CONTEXT_ITEMS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              data-testid={index === CONTEXT_ITEMS.length - 1 ? "harness-context-last" : undefined}
              className="w-full rounded-[var(--radius-sm)] px-2 py-2 text-left text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <AppShell
      brandHref="/dev/shell-harness"
      brandSubtitle="Shell harness"
      navSectionLabel="Organization"
      navItems={NAV_ITEMS}
      pathname="/dev/shell-harness"
      userInitials="SH"
      userName="Shell Harness"
      userEmail="harness@navfarm.test"
      onLogout={() => undefined}
      signOutLabel="Sign out"
      profileItems={[{ label: "Account" }, { label: "Preferences" }, { label: "Settings" }]}
      profileMenuLabel="Account menu"
      breadcrumbRoot="Harness"
      breadcrumbCurrent="Shell geometry"
      contextNav={withContextNav ? contextNav : undefined}
      pageHeader={
        <div className="border-b border-[var(--border)] px-6 py-5" data-testid="harness-page-header">
          <h1 className="text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">Shell geometry</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Fixture route for shell layout tests.</p>
        </div>
      }
    >
      <div className="px-6 py-6" data-testid="harness-content">
        <button
          type="button"
          data-testid="harness-dialog-trigger"
          onClick={() => setDialogOpen(true)}
          className="nf-press mb-4 min-h-11 rounded-[var(--radius-sm)] border border-[var(--border)] px-4 text-sm text-[var(--text-primary)]"
        >
          Open dialog
        </button>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Harness dialog"
          description="Fixture dialog for overlay taxonomy tests."
        >
          <button type="button" data-testid="harness-dialog-body-action" className="min-h-11">
            Dialog action
          </button>
        </Dialog>

        {CONTENT_ROWS.map((row) => (
          <p
            key={row}
            data-testid={row === CONTENT_ROWS.length ? "harness-content-last" : undefined}
            className="border-b border-[var(--border-subtle)] py-6 text-sm text-[var(--text-secondary)]"
          >
            Content row {row}
          </p>
        ))}
      </div>
    </AppShell>
  );
}
