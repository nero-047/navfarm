'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  panelId?: string;
}

/** Underline-style tab navigation — typography drives the active state, no pill/card chrome. */
export function Tabs({ items, value, onChange, className, panelId }: TabsProps) {
  const id = useId();
  return (
    <div className={cn('flex shrink-0 gap-1 overflow-x-auto overflow-y-hidden border-b border-(--border)', className)} role="tablist">
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`${id}-${item.value}`}
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(event) => {
              const index = items.findIndex((candidate) => candidate.value === item.value);
              const next = event.key === 'ArrowRight' ? (index + 1) % items.length
                : event.key === 'ArrowLeft' ? (index + items.length - 1) % items.length
                : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : -1;
              if (next < 0) return;
              event.preventDefault();
              document.getElementById(`${id}-${items[next].value}`)?.focus();
              onChange(items[next].value);
            }}
            onClick={() => onChange(item.value)}
            className={cn(
              'nf-press relative shrink-0 whitespace-nowrap px-3.5 py-2.5 text-[14px] transition-colors',
              isActive ? 'font-semibold text-(--text-primary)' : 'font-normal text-(--text-secondary) hover:text-(--text-primary)'
            )}
          >
            {item.label}
            {isActive && <span className="absolute inset-x-3.5 -bottom-px h-[2px] rounded-full bg-(--accent)" />}
          </button>
        );
      })}
    </div>
  );
}
