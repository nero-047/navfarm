import * as React from 'react';
import { cn } from '@/lib/utils';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  // Lets consumers with a non-default surface (e.g. a panel already on
  // --surface) keep that background instead of the card-bg default, without
  // reaching past the wrapper div that owns the scroll/border/radius.
  wrapperClassName?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, wrapperClassName, ...props }, ref) => (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]',
        wrapperClassName
      )}
    >
      <table ref={ref} className={cn('w-full border-collapse text-left text-sm', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('bg-[var(--surface-raised)] border-b border-[var(--row-border)]', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn(className)} {...props} />
);
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('border-t border-[var(--row-border)] bg-[var(--surface-raised)] font-semibold', className)}
      {...props}
    />
  )
);
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b border-[var(--row-border)] transition-colors last:border-b-0 hover:bg-[var(--row-hover)]', className)}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn('h-10 px-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]', className)}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('px-4 py-3 text-xs text-[var(--text-primary)]', className)} {...props} />
  )
);
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell };
