"use client";

import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { usePopoverSurface } from "./popover";

/**
 * The menu surface that lives inside a `<Popover>`.
 *
 * `Menu` owns keyboard traversal for the WAI-ARIA menu-button pattern —
 * Arrow keys, Home, End — and moves focus in on open. Every item carries
 * `tabIndex={-1}`, so the menu is a single stop in the page's tab order and
 * Tab necessarily leaves it, which the popover reads as a dismissal.
 *
 * Escape is not handled here on purpose: the popover owns dismissal and focus
 * restoration for every one of its surfaces, so there is exactly one place
 * where "closed" is decided.
 */

const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemradio"]';

function items(container: HTMLElement | null): HTMLElement[] {
  return container ? Array.from(container.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) : [];
}

export function Menu({ label, children }: { label: string; children: ReactNode }) {
  const { intent } = usePopoverSurface();
  const ref = useRef<HTMLDivElement>(null);

  // Focus entry. The menu mounts only while open, so this runs exactly once per
  // opening — no timers, no polling for the panel to exist.
  useEffect(() => {
    const entries = items(ref.current);
    if (!entries.length) return;
    const target = intent === "last" ? entries[entries.length - 1] : entries[0];
    target.focus({ preventScroll: true });
  }, [intent]);

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const entries = items(ref.current);
    if (!entries.length) return;
    const current = entries.indexOf(document.activeElement as HTMLElement);

    let next: number;
    switch (event.key) {
      case "ArrowDown": next = current < 0 ? 0 : (current + 1) % entries.length; break;
      case "ArrowUp": next = current <= 0 ? entries.length - 1 : current - 1; break;
      case "Home": next = 0; break;
      case "End": next = entries.length - 1; break;
      default: return;
    }

    event.preventDefault();
    entries[next].focus({ preventScroll: true });
  }

  return (
    <div ref={ref} role="menu" aria-label={label} data-menu onKeyDown={onKeyDown}>
      {children}
    </div>
  );
}

export interface MenuItemProps {
  children: ReactNode;
  /** Renders the item as a link. Mutually exclusive with `onSelect`. */
  href?: string;
  onSelect?: () => void;
  /**
   * Marks the item unavailable. Kept focusable and announced via
   * `aria-disabled` rather than the native attribute, so keyboard traversal
   * still reaches it — a menu whose items silently vanish from the arrow-key
   * order is harder to use, not easier.
   */
  disabled?: boolean;
  /** Presence turns the item into a `menuitemradio` — a choice, not a command. */
  checked?: boolean;
  /** `danger` is the destructive treatment. Reserved, never decorative. */
  tone?: "default" | "danger";
  /** Optional leading element (avatar, status dot). Kept small and meaningful. */
  leading?: ReactNode;
  /** Optional second line. Use only when the label alone is ambiguous. */
  secondary?: ReactNode;
}

export function MenuItem({
  children,
  href,
  onSelect,
  disabled = false,
  checked,
  tone = "default",
  leading,
  secondary,
}: MenuItemProps) {
  const { close } = usePopoverSurface();

  function activate(event: { preventDefault: () => void }) {
    if (disabled) {
      event.preventDefault();
      return;
    }
    // Close first so focus is back on the trigger before the selection runs —
    // a selection that navigates or signs out then unmounts an element that no
    // longer holds focus.
    close();
    onSelect?.();
  }

  const shared = {
    role: checked === undefined ? ("menuitem" as const) : ("menuitemradio" as const),
    tabIndex: -1,
    "data-menu-item": "",
    "data-tone": tone,
    "aria-disabled": disabled || undefined,
    "aria-checked": checked,
  };

  const body = (
    <>
      {leading && <span data-menu-item-leading>{leading}</span>}
      <span data-menu-item-body>
        <span data-menu-item-label>{children}</span>
        {secondary && <span data-menu-item-secondary>{secondary}</span>}
      </span>
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        {...shared}
        href={href}
        onClick={activate}
        // An anchor activates on Enter but not on Space; menu items must do both.
        onKeyDown={(event) => {
          if (event.key !== " ") return;
          event.preventDefault();
          event.currentTarget.click();
        }}
      >
        {body}
      </Link>
    );
  }

  return (
    <button {...shared} type="button" onClick={activate}>
      {body}
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" data-menu-separator />;
}

/**
 * Non-interactive heading inside a popover panel. Sits outside `<Menu>` so it
 * never counts as a menu item.
 *
 * `identity` states who you are and is the strongest text in the panel;
 * `caption` only says what the list below is, and stays quieter than the
 * entries it introduces.
 */
export function PopoverHeading({
  title,
  subtitle,
  variant = "identity",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  variant?: "identity" | "caption";
}) {
  return (
    <div data-popover-heading data-variant={variant}>
      <p data-popover-heading-title>{title}</p>
      {subtitle && <p data-popover-heading-subtitle>{subtitle}</p>}
    </div>
  );
}
