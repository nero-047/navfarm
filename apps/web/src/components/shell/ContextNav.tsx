"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import { Popover } from "../ui/popover";
import { Menu, MenuItem, PopoverHeading } from "../ui/menu";

/**
 * Contextual (module) navigation — level 2 of the three navigation levels in
 * apple.design.md §10.
 *
 * Primary navigation answers "where am I in Navfarm?" and is a navy structural
 * region. This answers "what am I doing inside this module?" and is deliberately
 * the quieter of the two: it sits on the light workspace surface, carries no
 * second dark panel and no filled active background, and earns its hierarchy
 * from typography, indentation and spacing rather than from more chrome
 * (§13). The content region stays the loudest thing on screen.
 *
 * One primitive serves every module. Master Data, Inventory, Finance and
 * Production each declare a `ContextNavModel` and share this renderer, rather
 * than hand-rolling four in-page sidebars as they did before.
 *
 * Routing is untouched. Selection remains `onSelect` against the page's own
 * state; `href` exists on the item type so a later phase can route without
 * reshaping the model.
 */

export interface ContextNavItem {
  key: string;
  label: string;
  /**
   * Reserved for a later phase. Phase 3 does not route — declaring an `href`
   * here changes nothing about how selection behaves today.
   */
  href?: string;
  /** Kept visible and focusable, announced unavailable. Never silently inert. */
  disabled?: boolean;
  /** Only where the information architecture genuinely benefits from one. */
  icon?: ElementType;
}

export interface ContextNavGroup {
  /**
   * Omitted for a flat module index. Presence is what makes the set "grouped",
   * which is also what selects the mobile presentation below.
   */
  label?: string;
  items: ContextNavItem[];
}

export interface ContextNavModel {
  /** Accessible name for the navigation landmark, e.g. "Master Data sections". */
  label: string;
  groups: ContextNavGroup[];
  activeKey: string;
  onSelect: (key: string) => void;
}

function itemsOf(model: ContextNavModel): ContextNavItem[] {
  return model.groups.flatMap((group) => group.items);
}

/* ── registration ────────────────────────────────────────────────────────── */

type ContextNavSetter = (model: ContextNavModel | null) => void;

const ContextNavContext = createContext<ContextNavSetter | null>(null);

/**
 * Lets a route hand its module index to the shell.
 *
 * The contextual navigation is a shell region — it has to sit outside `<main>`
 * so it holds still while the content scrolls (§12), and only the shell can
 * put it there. But the active section is page state, and moving that state
 * into the layout would mean the layout knowing every module's sections. So the
 * page keeps its state and registers a description of its index instead.
 *
 * Pass `null` to claim no contextual navigation. Routes that never call this
 * hook stay full-width, which is how every non-module route keeps its layout.
 */
export function useContextNav(model: ContextNavModel | null): void {
  const setModel = useContext(ContextNavContext);

  // The page's current model, so a registered index always calls back into the
  // page's latest handlers without having to re-register to pick them up.
  const modelRef = useRef(model);
  modelRef.current = model;

  // Re-registration is driven by what the index actually renders, not by object
  // identity. Pages build their model through a useMemo whose dependencies are
  // not referentially stable — t() and tLabel() are rebuilt on every
  // LanguageProvider render — so keying on identity meant setModel -> provider
  // re-render -> a new model object -> setModel, without end. That loop is not
  // a slow render: it exhausts the stack.
  const signature = model
    ? JSON.stringify([
        model.label,
        model.activeKey,
        model.groups.map((group) => [
          group.label,
          group.items.map((item) => [item.key, item.label, item.disabled ?? false]),
        ]),
      ])
    : null;

  useEffect(() => {
    if (!setModel) return;
    const current = modelRef.current;
    if (!current) {
      setModel(null);
      return;
    }
    // onSelect delegates through the ref so the registered index keeps working
    // after the page re-renders with a new handler.
    setModel({ ...current, onSelect: (key) => modelRef.current?.onSelect(key) });
  }, [setModel, signature]);

  // Only a route actually leaving should clear the index. Clearing it on every
  // model change unmounted and rebuilt the whole module index on each
  // selection, which is what made the sub-navigation visibly refresh between
  // pages.
  useEffect(() => {
    if (!setModel) return;
    return () => setModel(null);
  }, [setModel]);
}

/**
 * Owns the registered model and hands it back for the shell to render.
 *
 * Lives in the console layout, above the routed page, so registration survives
 * the page's own re-renders.
 */
export function ContextNavProvider({
  children,
}: {
  children: (contextNav: ReactNode) => ReactNode;
}) {
  const [model, setModel] = useState<ContextNavModel | null>(null);
  return (
    <ContextNavContext.Provider value={setModel}>
      {children(model ? <ContextNav model={model} /> : undefined)}
    </ContextNavContext.Provider>
  );
}

/* ── presentation ────────────────────────────────────────────────────────── */

function ContextNavList({ model }: { model: ContextNavModel }) {
  const grouped = model.groups.some((group) => group.label);

  return (
    <nav
      aria-label={model.label}
      data-context-nav
      data-grouped={grouped ? "true" : "false"}
    >
      {model.groups.map((group, index) => (
        <div key={group.label ?? index} data-context-nav-group>
          {group.label && <p data-context-nav-group-label>{group.label}</p>}
          <ul data-context-nav-items>
            {group.items.map((item) => {
              const active = item.key === model.activeKey;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    data-context-nav-item
                    data-testid={`context-nav-item-${item.key}`}
                    // Not `aria-selected`: this is a navigation landmark, not a
                    // tablist. The entry the user is currently looking at is the
                    // current page of this index.
                    aria-current={active ? "page" : undefined}
                    aria-disabled={item.disabled || undefined}
                    onClick={() => {
                      if (item.disabled) return;
                      model.onSelect(item.key);
                    }}
                  >
                    {item.icon && <item.icon size={15} strokeWidth={1.75} aria-hidden="true" />}
                    <span data-context-nav-item-label>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/**
 * Mobile presentation for a grouped index.
 *
 * A twenty-entry, five-group tree cannot become a tab strip, and repeating the
 * whole column above the content would push the actual work off the first
 * screen. So below the desktop breakpoint it collapses to an anchored
 * selector, built on the Phase 2 popover rather than a second overlay
 * implementation. Grouped entries are `menuitemradio` — choosing a section is
 * a selection, not a command.
 *
 * The trigger names the module index it opens, not the section it has selected.
 * It used to show the active entry, which put the current section's name
 * directly above the page's H1 — the same word twice, one line apart, with the
 * quieter of the two sitting first and reading like the title. Level 2 states
 * where you can go; the H1 beneath states where you are, and it states it once.
 * The current section is still conveyed: the accessible name carries it for
 * assistive technology, and the menu marks it `aria-checked`.
 */
function ContextNavSelector({ model }: { model: ContextNavModel }) {
  const [open, setOpen] = useState(false);
  const active = itemsOf(model).find((item) => item.key === model.activeKey);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="start"
      haspopup="menu"
      className="w-full"
      trigger={(props) => (
        <button
          {...props}
          data-context-nav-trigger
          data-testid="context-nav-trigger"
          aria-label={`${model.label} — current: ${active?.label ?? ""}`}
        >
          {/* The module label, e.g. "Master Data sections" — already translated
              by the route that registered it. The accessible name above still
              appends the current entry, and starts with this same string, so
              the visible label remains a prefix of the accessible one. */}
          <span data-context-nav-trigger-label>{model.label}</span>
          <ChevronDown size={15} strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
    >
      <PopoverHeading title={model.label} variant="caption" />
      <Menu label={model.label}>
        {model.groups.map((group, index) => (
          // `role="group"` is the one way to caption a run of entries that is
          // valid inside `role="menu"` — a bare heading element there is not.
          <div
            key={group.label ?? index}
            role="group"
            aria-label={group.label}
            data-context-nav-menu-group
          >
            {group.label && <p data-context-nav-menu-group-label>{group.label}</p>}
            {group.items.map((item) => (
              <MenuItem
                key={item.key}
                checked={item.key === model.activeKey}
                disabled={item.disabled}
                onSelect={() => model.onSelect(item.key)}
              >
                {item.label}
              </MenuItem>
            ))}
          </div>
        ))}
      </Menu>
    </Popover>
  );
}

export function ContextNav({ model }: { model: ContextNavModel }) {
  const grouped = model.groups.some((group) => group.label);

  // Both presentations are rendered and swapped in CSS rather than measured in
  // JS: it keeps the server and client markup identical, and `display: none`
  // takes the inactive one out of the accessibility tree, so only one
  // navigation landmark is ever exposed. The flat case needs no swap at all —
  // the same list is a column on desktop and a scrolling strip below it.
  return (
    <>
      <ContextNavList model={model} />
      {grouped && (
        <div data-context-nav-selector>
          <ContextNavSelector model={model} />
        </div>
      )}
    </>
  );
}
