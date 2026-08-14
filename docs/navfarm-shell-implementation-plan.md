# NAVFARM — AUTHORITATIVE SHELL / UX IMPLEMENTATION PLAN

This document is the authoritative implementation contract for the Navfarm application redesign.

The source hierarchy is:

1. `apple.design.md` — authoritative product-design direction
2. `navfarm.com` — authoritative Navfarm brand identity
3. supplied operational screenshots — UX / information-architecture inspiration
4. this document — authoritative implementation sequence and gates

Do not reinterpret these phases from memory.
Do not invent missing phases.
Do not skip exit gates.

Phase 0 is already complete and accepted.

==================================================

## PHASE 1 — APPLICATION SHELL GEOMETRY

==================================================

Objective:

Replace the current document-scrolling application shell with a real application workspace.

Desktop >= 1024px:

The shell must use:

- `100dvh`
- fixed/stationary primary navigation
- stable global header
- independently scrollable main content
- conditional contextual navigation
- explicit `min-height: 0` sizing chain
- `minmax(0, 1fr)` grid tracks
- contained scroll chaining

Desktop structure:

PRIMARY NAV | MAIN CONTENT

or, when context navigation applies:

PRIMARY NAV | CONTEXT NAV | MAIN CONTENT

Required shell regions:

- `data-shell-root`
- `data-shell-region="header"`
- `data-shell-region="primary-nav"`
- `data-shell-region="workspace"`
- `data-shell-region="context-nav"`
- `data-shell-region="content"`
- `data-shell-region="page-header"`

The application `<main>` is the primary content scroller.

The shell root owns the desktop viewport geometry.

Required CSS behavior:

Desktop shell:

- `height: 100dvh`
- `min-height: 0`
- `overflow: hidden`

Workspace:

- `min-height: 0`

Content:

- `min-height: 0`
- `overflow-y: auto`

Context navigation:

- `min-height: 0`
- `overflow-y: auto`

Use:

`minmax(0, 1fr)`

for flexible grid tracks.

Use:

`overscroll-behavior: contain`

on independent scroll regions.

Do not introduce intermediary overflow containers that break sticky positioning.

Do not use `100vh` for the desktop pinned shell.

Primary navigation:

The primary navigation must render once.

Do not render separate duplicate desktop/mobile copies of the navigation content.

Below 1024px the same navigation becomes the mobile off-canvas navigation.

Mobile navigation semantics:

Do NOT put `role="dialog"` directly on `<nav>`.

Use:

```html
<div role="dialog" aria-modal="true">
  <nav aria-label="Primary">
    ...
  </nav>
</div>
```

On desktop the `<nav>` remains a normal navigation landmark.

Scroll locking:

Introduce a centralized `useScrollLock()`.

Do not allow Dialog, Drawer, or mobile navigation to directly manipulate:

`document.body.style.overflow`

independently.

Shell readiness:

Expose:

`data-shell-ready`

after the shell has committed its initial render so browser tests do not depend on arbitrary delays.

Exit gate:

Playwright tests must prove:

Main content scrolls independently.
Document/body does not become the primary desktop vertical scroller.
Primary navigation remains fixed.
Global header remains fixed.
Context navigation scrolls independently where present.
No scroll chaining occurs between shell regions.
No horizontal page overflow occurs.
Mobile navigation opens and closes correctly.
Long content does not break shell geometry.
Long contextual navigation does not break shell geometry.

Run against:

Chromium
Firefox
WebKit

Run the gate with exactly this command:

    pnpm exec nx run web-e2e:e2e --skip-nx-cache

`--skip-nx-cache` is mandatory, not optional. The `e2e` target is cacheable, so
without it Nx replays a prior result: a cached "42 passed" returns in seconds,
reproduces the earlier run's per-test durations byte for byte, and is not
evidence that the current working tree passes. A gate run that did not print a
real browser execution did not happen.

Do not proceed to Phase 2 until this gate is green.

==================================================

## PHASE 2 — POPOVER / PROFILE / OVERLAY FOUNDATION

==================================================

Objective:

Create a consistent overlay foundation and correct the account/profile UX.

Components:

Create or standardize:

Popover
Menu
ProfilePopover

Profile behavior:

Remove permanent Sign Out from the primary rail.

Use:

Avatar
→ Profile Popover
→ Account / Preferences / Settings
→ Sign out

Popover requirements:

Support:

`aria-haspopup`
`aria-expanded`
`aria-controls`
Escape
outside click
keyboard navigation
Arrow Up/Down
Home/End
Tab-out
focus on open
focus restoration on close

Overlay taxonomy:

Popover:

Use for:

profile menu
workspace switcher
notifications
small choices
column chooser
date range
language
theme
row overflow actions

Dialog:

Use for:

confirmation
destructive confirmation
very small focused decisions
approximately 0–2 fields

Drawer:

Use for:

record detail
create/edit forms requiring more than a couple of fields
contextual detail
larger focused tasks

Full page:

Use for:

multi-step workflows
interactions requiring substantial viewport space
independent navigation/state

Structural rules:

Popover must not open another popover without closing the first.
Drawer may contain a Dialog.
Drawer must not open another Drawer.
Anything requiring most of the viewport should generally be a page.
Every overlay uses `useScrollLock()`.
Escape closes the overlay where appropriate.
Focus enters correctly.
Focus returns to the trigger.

Exit gate:

Keyboard-test:

profile popover
workspace switcher
notification popover
dialog
drawer

Verify:

keyboard navigation
Escape
outside click
focus entry
focus restore
correct semantics

Do not proceed to Phase 3 until the gate is green.

==================================================

## PHASE 3 — PRIMARY + CONTEXTUAL NAVIGATION

==================================================

Objective:

Establish a clear hierarchy:

PRIMARY NAVIGATION
↓
CONTEXTUAL NAVIGATION
↓
PAGE CONTENT

Primary navigation:

Global application navigation.

Characteristics:

quiet structural presence
14px text maximum
~17px icons maximum
Navfarm navy structural region
restrained active state
optional 2px red indicator
no saturated red fills in chrome

Contextual navigation:

Contextual/module index.

Only these current routes get a contextual-navigation column:

`/console/master-data`
`/console/inventory`
`/console/finance`
`/console/production`

All other current routes remain full-width content.

Context navigation must visually differ from primary navigation.

Use:

typography
indentation
spacing
grouping
subtle active treatment

Do NOT:

create a second dark sidebar
use filled red active backgrounds
make context navigation louder than primary navigation
use unnecessary icons

Quiet-zone rule:

The shell must visually recede while the page content dominates.

Rules:

shell chrome text ≤ 15px
page title ~28px / 600
primary nav active state remains restrained
context nav has no filled red active background
the strongest visual emphasis should remain in the content region

Routing constraint:

DO NOT change routing.

Context navigation may define:

`href?: string`

for future compatibility, but current behavior remains:

`onSelect` + existing page state

No URL changes in this phase.

Exit gate:

Render the application at:

1440×900
1280×800
834×1112
390×844

Verify visually:

primary navigation is subordinate
contextual navigation is more subordinate
page content dominates
no filled red contextual active state
navigation levels are immediately distinguishable
no duplicate-looking sidebars

Do not proceed to Phase 4 until this gate is green.

==================================================

## PHASE 4 — PAGE HEADER

==================================================

Objective:

Create a single consistent page-header hierarchy.

Create:

PageHeader

Structure:

Breadcrumb
↓
Page title
↓
Description
↓
Actions
↓
Toolbar / metadata when necessary

Rules:

exactly one `<h1>` per route
page title belongs to the content region
navigation labels must not compete with the H1
search/filter/action controls belong to content
page header may be sticky inside the main content scroller
do not insert an overflow container that breaks sticky positioning

Master Data:

Where MasterDataTable currently owns its own heading/toolbar, move that responsibility into PageHeader.

Do not change business semantics.

Exit gate:

Automated browser tests must verify:

one H1 on reviewed routes
page header remains visible while content scrolls
contextual navigation does not become a competing heading hierarchy

Do not proceed to Phase 5 until green.

==================================================

## PHASE 5 — DRAWER / OVERLAY TAXONOMY

==================================================

Objective:

Implement the Drawer/Sheet foundation and apply the agreed overlay taxonomy.

Drawer:

Desktop:

right-side drawer
approximately 480px / 720px according to task size

Mobile:

bottom sheet
approximately 92dvh
internal body scroll
fixed footer when appropriate

Reclassification:

Popover:

profile
workspace switcher
column chooser
date range
language
theme
row actions

Dialog:

confirmations
small focused decisions
<=2 field interactions

Drawer:

record detail
create/edit forms with >2 fields
larger contextual tasks
complex object editing

Full-page:

onboarding
multi-step workflows
tasks with their own navigation/progress

Rules:

no nested drawers
drawers support proper focus trapping
focus returns on close
Escape works
centralized scroll lock
fixed drawer footer where necessary
drawer body independently scrolls

Exit gate:

Verify:

no unnecessary large Dialog forms remain
drawer focus restoration works
drawer does not create nested drawer stacks
scroll locking is centralized
existing application behavior is preserved

Do not proceed to Phase 6A until green.

==================================================

## PHASE 6A — SHARED PRIMITIVE CONSOLIDATION

==================================================

Objective:

Consolidate competing UI systems without behavior regressions.

Target shared primitives:

Button
Input
Field
Select
Dialog
Popover
Drawer
Badge
EmptyState
ErrorState
LoadingState
OperationalSummary
Lifecycle
other appropriate shared primitives

Critical migration rule:

This is NOT a rename/search-and-replace operation.

source-ui and ui primitives differ.

In particular:

`source-ui/Input`:

composite
label support
icon support
80+ call sites depend on label behavior

`ui/Input`:

bare input

Therefore migrate forms explicitly:

Field
→ Input

Do not silently remove labels.

Button migration:

Preserve behavioral and visual semantics.

Existing variants such as:

primary
secondary
ghost
warning
info
success
danger

must be mapped intentionally.

Do not assume variant names are interchangeable.

source-ui:

Migrate all production consumers from:

`components/source-ui/`

to the approved shared system.

Only delete `source-ui/` when:

all consumers are migrated
typecheck passes
build passes
browser behavior is verified

const S:

Do NOT mechanically delete local style objects.

Only remove them after the associated screen/component has been migrated successfully to the shared token/primitive system.

Exit gate:

no production imports from source-ui
no competing Button/Card/Input systems
forms preserve labels
interaction states remain correct
accessibility remains correct
typecheck passes
build passes
affected browser screens remain correct

==================================================

## PHASE 6B — TABLE CONSOLIDATION

==================================================

Objective:

Migrate raw table implementations into a coherent table system without destroying domain-specific behavior.

Current baseline:

52 raw tables
28 files
30 operational
9 CRUD
7 admin
6 financial
production batch panel alone has 12

IMPORTANT:

Do NOT enforce:

no raw `<table>` anywhere

as a blind global rule.

Tables must be migrated by class.

Migration classes:

CRUD
Operational
Financial
Admin

Shared Table must support:

normal rows
sorting
row actions
loading
empty
error
pagination where required
horizontal overflow where required
responsive behavior

State rule:

API failure must never render as an empty state.

Shared table states must distinguish:

loading
empty
error
populated

Mobile tables:

Normal record tables may stack below the mobile breakpoint.

Financial structures such as:

ledgers
trial balance
balance sheet
profit & loss

remain tabular with local horizontal scrolling because column alignment is part of the information architecture.

Approved exceptions:

A raw table may temporarily remain when:

it has a documented reason
its behavior cannot yet be represented safely by the shared Table
responsive behavior is verified
the exception is recorded

Do not mechanically rewrite complex operational tables.

Exit gate:

ordinary tables migrated or explicitly excepted
no uncontained horizontal overflow
errors do not appear as empty states
accessibility preserved
behavior preserved
typecheck passes
build passes
browser tests pass

==================================================

## PHASE 6.5 — SHELL VISUAL QA

==================================================

This is a mandatory gate.

NO SCREEN REDESIGN BEFORE THIS PASSES.

Render:

1440×900
1280×800
834×1112
390×844

Test:

light mode
dark mode

Brand review:

Must show:

official Navfarm logo
`#C24332` brand red
`#2E313F` navy
predominantly light/neutral application foundation
no borrowed green/blue/purple brand palette
no Apple blue

Hierarchy review:

Must show:

page content visually dominant
primary navigation subordinate
contextual navigation even more subordinate
clear page title hierarchy
quiet chrome

UX review:

Verify visually and behaviorally:

native-app feeling shell
stable primary navigation
stable header
correct context-navigation behavior
profile popover feels anchored
overlays feel appropriate
content scrolls independently
context navigation scrolls independently when present

Responsive review:

Check:

no overflow
no clipped controls
correct mobile navigation
correct mobile context-navigation strategy
correct touch targets

Do NOT proceed to Phase 7 if:

the shell is technically correct but visually wrong.

==================================================

## PHASE 7 — SCREEN REDESIGN

==================================================

Blocked until:

Phase 0 green
Phase 1 green
Phase 2 green
Phase 3 green
Phase 4 green
Phase 5 green
Phase 6A green
Phase 6B green or explicitly documented exceptions
Phase 6.5 visual approval

Then redesign in this order:

Master Data — class 1 reference
One operational reference screen
One analytics/reporting reference screen
One settings/admin reference screen
Remaining screens by page class

Use supplied operational screenshots for:

information density
workflow/lifecycle
summary strips
quick actions
structured forms
operational tables
multi-section task layouts

Do NOT copy their:

colors
logo
literal layout
exact component styling

The result must be:

NAVFARM BRAND
+
APPLE PRODUCT DESIGN
+
OPERATIONAL UX

==================================================

## GLOBAL NON-NEGOTIABLES

==================================================

Never change without explicit approval:

API contracts
authentication
authorization
business logic
calculations
routing
data models
domain semantics

Never introduce:

decorative gradients
purple AI visual language
glowing borders
neon surfaces
excessive pills
giant shadows
generic SaaS dashboard patterns
marketing-page composition
AI-generated decorative visuals

Prefer:

typography
spacing
alignment
restrained surfaces
subtle borders
deliberate interaction states

==================================================

## CURRENT STATUS

==================================================

Phase 0 is already complete.

Phase 0 accepted baseline:

typecheck: GREEN
build: GREEN
unit tests: GREEN (4/4)
lint: 67 errors / 410 warnings, FROZEN PRE-EXISTING BASELINE
no application code changed in Phase 0

Known separate follow-up issue:

The obsolete demo workflow test was deleted because its original module no longer exists and its business logic now lives in the API. The corresponding costing/QC rules are currently without that former test coverage.

This is an API-side test-coverage ticket, NOT part of the Navfarm design migration.

==================================================

## PHASE PROCESS

==================================================

For each phase:

Read this document.
Implement only that phase.
Run that phase's exit gate.
Report:
files changed
tests run
results
regressions, if any
STOP.

Never automatically advance to the next phase.

No screen-level redesign until Phase 6.5 is explicitly approved.

==================================================

END OF AUTHORITATIVE PLAN

==================================================
