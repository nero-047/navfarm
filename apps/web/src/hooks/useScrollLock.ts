"use client";

import { useEffect } from "react";

/**
 * Centralized page-scroll lock.
 *
 * Every overlay in the application (dialog, full-page overlay, mobile
 * navigation, and the drawer that arrives in a later phase) routes through
 * this hook instead of writing `document.body.style.overflow` itself. Two
 * overlays that each save/restore that property independently corrupt each
 * other: a dialog opened from inside another overlay captures the already
 * locked value as its "original", and restores the page to `hidden` when it
 * closes. The lock is therefore reference counted here — the page unlocks
 * once, when the last holder releases.
 *
 * Removing the body scrollbar reflows the page under the overlay, so the lock
 * replaces its width with padding while it is held.
 *
 * `data-scroll-locked` on <html> is the public signal for CSS and for browser
 * tests, which should never have to infer lock state from inline styles.
 */

let lockCount = 0;
let restore: (() => void) | null = null;

function acquire(): void {
  lockCount += 1;
  if (lockCount > 1) return;

  const { body, documentElement } = document;
  const previousOverflow = body.style.overflow;
  const previousPaddingRight = body.style.paddingRight;
  // Overlay scrollbars (touch devices, macOS default) report 0 and need no
  // compensation; classic scrollbars would otherwise shift the page sideways.
  const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

  body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    const current = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${current + scrollbarWidth}px`;
  }
  documentElement.setAttribute("data-scroll-locked", "true");

  restore = () => {
    body.style.overflow = previousOverflow;
    body.style.paddingRight = previousPaddingRight;
    documentElement.removeAttribute("data-scroll-locked");
  };
}

function release(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;
  restore?.();
  restore = null;
}

/**
 * Locks page scrolling while `active` is true. Safe to nest: the page stays
 * locked until every active caller has released it.
 */
export function useScrollLock(active = true): void {
  useEffect(() => {
    if (!active) return;
    acquire();
    return release;
  }, [active]);
}

/** Test-only view of the lock depth. */
export function __getScrollLockCount(): number {
  return lockCount;
}
