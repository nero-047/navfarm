"use client";

import { useState } from "react";
import { Popover } from "../ui/popover";
import { Menu, MenuItem, MenuSeparator, PopoverHeading } from "../ui/menu";

/**
 * The account menu.
 *
 * Sign out used to be a permanent button in the navigation rail — standing
 * infrastructure for something a user does once a day at most, occupying the
 * same visual weight as the modules they work in all day. It is an account
 * action, so it lives here, behind the avatar, alongside the rest of the
 * account surface (apple.design.md §15).
 *
 * The trigger sits in the global header rather than at the foot of the rail:
 * below 1024px the rail is an off-canvas modal drawer, and burying the only
 * route to sign out inside a dialog — or opening a popover from within one —
 * is worse on the breakpoint where it matters most.
 */

export interface ProfileMenuItem {
  label: string;
  /** Destination. Items without one render as unavailable rather than inert. */
  href?: string;
}

/**
 * The account entries every shell route shows, in order, as translation keys.
 *
 * None of them carries an `href` yet: the application has no account,
 * preferences or settings route, and Phase 2 does not add routes. They are
 * therefore rendered as unavailable rather than as controls that do nothing.
 * When those screens land, giving the item an `href` is the only change needed.
 */
export const PROFILE_ITEMS = ["account", "preferences", "settings"] as const;

export interface ProfilePopoverProps {
  initials: string;
  name?: string;
  email?: string;
  /** Account entries above the separator, in order. */
  items: ProfileMenuItem[];
  signOutLabel: string;
  onSignOut: () => void;
  /** Accessible name of the trigger, e.g. "Account menu". */
  triggerLabel: string;
}

export function ProfilePopover({
  initials,
  name,
  email,
  items,
  signOutLabel,
  onSignOut,
  triggerLabel,
}: ProfilePopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      haspopup="menu"
      trigger={(props) => (
        <button
          {...props}
          data-profile-trigger
          data-testid="profile-trigger"
          aria-label={name ? `${triggerLabel} — ${name}` : triggerLabel}
        >
          <span data-profile-avatar aria-hidden="true">{initials}</span>
        </button>
      )}
    >
      <PopoverHeading title={name || triggerLabel} subtitle={email} />
      <Menu label={triggerLabel}>
        {items.map((item) => (
          // No destination yet means no promise: the entry stays visible and
          // keyboard-reachable, and announces that it cannot be activated,
          // rather than being a control that silently does nothing.
          <MenuItem key={item.label} href={item.href} disabled={!item.href}>
            {item.label}
          </MenuItem>
        ))}
        <MenuSeparator />
        <MenuItem tone="danger" onSelect={onSignOut}>
          {signOutLabel}
        </MenuItem>
      </Menu>
    </Popover>
  );
}
