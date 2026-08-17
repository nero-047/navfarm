# Phase 7 — Auth Experience Polish

Targeted fix for the authentication experience: theme coherence between
the branding panel and the form, a real System/Light/Dark preference
(not just a light/dark toggle), and a password visibility control.
Scope was deliberately narrow — auth pages and the shared theme
mechanism only, nothing else in the app touched.

## 1. Theme coherence — what was actually wrong

The branding panel was `bg-[var(--color-navy)]` — a single fixed color,
regardless of theme. The form panel used `bg-(--bg)`, which does vary by
theme. In light mode this read as "deliberately deep panel next to a
light form," which is a legitimate design choice the task explicitly
allows. In dark mode it broke: `--bg` dark (`#1c1e27`) is *darker* than
navy (`#2e313f`), so the two panels' contrast relationship inverted
compared to light mode — the "branding" panel became the lighter, more
prominent surface, which reads as two unrelated systems rather than one
coherently dark page.

Fix: swap the hardcoded navy for `--sidebar-bg` — a token the rest of
the app already uses for exactly this "deep branded chrome" role (navy
in light mode, near-black `#14161c` in dark mode; this pairing is
already documented in `global.css` as the app's dark-mode "luminance
ladder"). No new token needed — this is the textbook case for reusing
an existing one rather than inventing a new one. See
`AUTH-login-system-light_1440.png` vs `AUTH-login-system-dark_1440.png`:
in dark mode the branding panel is now visibly *deeper* than the form
panel, the same relationship light mode has, instead of the reverse.

## 2. Theme selector

New `ThemeSelector` component (`apps/web/src/components/ui/theme-selector.tsx`):
a three-way segmented control (System/Light/Dark) rather than a dropdown
— with only three options, a `role="radiogroup"` keeps every choice
visible and reachable in one tab stop. Placed top-right of the auth
composition, the same corner the main app uses for its theme control.

Underlying mechanism (`apps/web/src/hooks/useTheme.tsx`, rewritten):
- Preference model is now `"system" | "light" | "dark"`, not just
  `"light" | "dark"`. `"system"` is the default for anyone with no
  stored choice.
- `"system"` subscribes to `matchMedia("(prefers-color-scheme: dark)")`
  and updates the resolved theme live if the OS changes — verified in
  `auth.spec.ts`, not just claimed (see below).
- An explicit `"light"`/`"dark"` choice is written to `localStorage` and
  never touched by a later OS change — also verified directly.
- The pre-hydration inline script in `apps/web/src/app/layout.tsx` was
  updated to match this resolution order, so there's no flash of the
  wrong theme on first paint in any of the three states.
- `ThemeIconButton` (the existing single-click sun/moon toggle used
  throughout the rest of the app) keeps working unchanged — its
  `toggleTheme()` call now converts an implicit "system" into an
  explicit opposite-of-current choice on click, same one-click behavior
  it always had. Verified by rerunning the full existing shell/overlay
  suite, which exercises it — no regressions.

## 3. Password visibility control

New `PasswordInput` (`apps/web/src/components/ui/password-input.tsx`):
wraps the canonical `Input` rather than becoming a parallel primitive —
every prop (`id`, `value`, `onChange`, `required`, ...) still passes
straight through. Adds an Eye/EyeOff button inside the field, right
side, `type="button"` (so it can never submit the form), with
`aria-label` text that changes between "Show password" and "Hide
password" rather than a static label that goes stale after toggling.

Used in `LoginForm` and `SignupForm` (the only two password fields in
the auth flow — `ResetPasswordForm` only collects an email, it doesn't
have a password field). Verified directly, not assumed: value is
preserved across toggles, the toggle never submits or navigates, and it
activates via keyboard (`Enter` while focused) as well as click — see
`auth.spec.ts`.

A similar hand-rolled toggle already existed on the SMTP "App Password"
field in `/console/notifications` (out of scope for this task — it's a
different screen family), but it lacked an `aria-label` and used a raw
`<input>` rather than the canonical primitive. Not touched here; noted
for whoever next revisits that screen.

## 4/5. Screens reviewed, visual target

`/login`, `/signup`, `/reset-password` — all share `apps/web/src/app/(auth)/layout.tsx`
and updated in lockstep since they're one shared component, not three
independent screens that happened to look similar.

## 6. Responsive QA

Screenshots at all four required viewports × light/dark:
`AUTH-login-{1440x900 as "_1440",1280x800,834x1112,390x844}-{light,dark}.png`.
Below the `md:` breakpoint the branding panel doesn't squeeze — it's
`hidden md:flex`, so it disappears entirely and the mobile logo bar (a
separate, always-present element) takes over, exactly the "collapses
intentionally" requirement. The theme selector stays anchored top-right
at every width without colliding with the logo — verified both visually
and by an e2e assertion that checks for zero horizontal page overflow
at all four breakpoints.

## 7. Testing

`apps/web-e2e/src/auth.spec.ts` — 17 tests × 3 browsers = 51:
- System is the default for a fresh user
- System resolves to the OS preference (light and dark contexts)
- System reacts live to an OS preference change with no reload
- Explicit Light selection applies immediately and survives a reload
- Explicit Dark selection applies immediately and survives a reload
- An explicit choice is never overwritten by a later OS change
- The branding panel and form panel resolve to the same (dark) theme —
  computed-style luminance check, not just the page-level attribute
- Password: defaults hidden, toggles shown and back
- Password: value is preserved across both toggle directions
- Password: toggling never submits the form or navigates
- Password: toggle activates via keyboard
- Password: present and independent on the signup field
- Theme selector renders without overflow at all four viewports

All new tests pass on Chromium, Firefox, and WebKit.
