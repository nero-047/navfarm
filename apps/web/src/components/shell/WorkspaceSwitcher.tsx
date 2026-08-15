"use client";

import { useState } from "react";
import { Building2, ChevronRight } from "lucide-react";
import type { CompanyRef } from "../../hooks/useAuth";
import { Popover } from "../ui/popover";
import { Menu, MenuItem, PopoverHeading } from "../ui/menu";

/**
 * Active-company switcher.
 *
 * Behaviour is unchanged from the hand-rolled dropdown this replaces — the
 * same companies, the same selection effect, the same "home company" marker.
 * What changes is the foundation: it was a bespoke overlay with a transparent
 * click-away `<div>` covering the page, a local Escape listener, and no
 * `aria-haspopup`/`aria-expanded`/`aria-controls` at all. It now shares the one
 * Popover/Menu implementation with the account menu.
 *
 * Choosing a company is a selection, not a command, so the entries are
 * `menuitemradio` and the active one is `aria-checked`.
 */
export function WorkspaceSwitcher({
  companies,
  activeCompanyId,
  onSelect,
  label,
  homeCompanyLabel,
}: {
  companies: CompanyRef[];
  activeCompanyId: string | null;
  onSelect: (companyId: string) => void;
  label: string;
  homeCompanyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const active = companies.find((c) => c.company_id === activeCompanyId) || companies[0];

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      haspopup="menu"
      trigger={(props) => (
        <button
          {...props}
          data-testid="workspace-switcher-trigger"
          className="nf-press flex min-h-9 min-w-0 max-w-[190px] items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)] border py-[5px] pl-2.5 pr-2 text-xs font-semibold transition-colors sm:min-h-0"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface-secondary)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
          title={label}
          aria-label={`${label} — current: ${active.company_name}`}
        >
          <Building2 className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
          <span className="hidden truncate md:inline">{active.company_name}</span>
          <ChevronRight
            className="h-3 w-3 shrink-0 transition-transform"
            aria-hidden="true"
            style={{
              color: "var(--text-muted)",
              transform: props["data-state"] === "open" ? "rotate(90deg)" : "rotate(0deg)",
            }}
          />
        </button>
      )}
    >
      <PopoverHeading title={label} variant="caption" />
      <Menu label={label}>
        {companies.map((company) => (
          <MenuItem
            key={company.company_id}
            checked={company.company_id === activeCompanyId}
            onSelect={() => onSelect(company.company_id)}
            secondary={company.is_primary ? homeCompanyLabel : undefined}
          >
            {company.company_name}
          </MenuItem>
        ))}
      </Menu>
    </Popover>
  );
}
