'use client';

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
}

/** Underline-style tab navigation — typography drives the active state, no pill/card chrome. */
export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-(--border)', className)} role="tablist">
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={isActive}
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
