import React from 'react';
import { render, screen } from '@testing-library/react';
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from '../src/components/ui/table';

describe('Table primitives', () => {
  it('renders children through the full table structure', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Green Valley Farms</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Green Valley Farms')).toBeTruthy();
  });

  it('preserves className on every sub-component via merge, not replacement', () => {
    render(
      <table>
        <TableHeader className="bg-transparent" data-testid="thead">
          <tr />
        </TableHeader>
        <TableBody className="custom-body" data-testid="tbody">
          <TableRow className="custom-row" data-testid="row">
            <TableCell className="whitespace-nowrap" data-testid="cell">x</TableCell>
          </TableRow>
        </TableBody>
      </table>
    );
    expect(screen.getByTestId('thead').className).toContain('bg-transparent');
    expect(screen.getByTestId('tbody').className).toContain('custom-body');
    expect(screen.getByTestId('row').className).toContain('custom-row');
    // Row still carries its own border/hover defaults alongside the caller's class.
    expect(screen.getByTestId('row').className).toContain('border-[var(--row-border)]');
    expect(screen.getByTestId('cell').className).toContain('whitespace-nowrap');
  });

  it('resolves conflicting padding utilities deterministically (twMerge), the same guarantee Card relies on', () => {
    render(
      <table>
        <TableBody>
          <TableRow>
            <TableCell className="p-0" data-testid="cell">x</TableCell>
          </TableRow>
        </TableBody>
      </table>
    );
    const cell = screen.getByTestId('cell');
    expect(cell.className).toContain('p-0');
    expect(cell.className).not.toMatch(/(?<!\S)px-4(?!\S)/);
  });

  it('forwards colSpan for loading/empty rows spanning the full column count', () => {
    render(
      <table>
        <TableBody>
          <tr>
            <TableCell colSpan={5} data-testid="empty-cell">No records yet.</TableCell>
          </tr>
        </TableBody>
      </table>
    );
    const cell = screen.getByTestId('empty-cell') as HTMLTableCellElement;
    expect(cell.colSpan).toBe(5);
    expect(cell.textContent).toBe('No records yet.');
  });

  it('renders a footer row for computed totals (financial subtotal pattern)', () => {
    render(
      <table>
        <TableBody>
          <TableRow>
            <TableCell>Cash</TableCell>
            <TableCell>100.00</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <tr>
            <TableCell>Total Assets</TableCell>
            <TableCell data-testid="total">100.00</TableCell>
          </tr>
        </TableFooter>
      </table>
    );
    expect(screen.getByText('Total Assets')).toBeTruthy();
    expect(screen.getByTestId('total').textContent).toBe('100.00');
  });

  it('forwards arbitrary HTML attributes (role, aria) needed by consumer layouts', () => {
    render(
      <table>
        <TableBody>
          <TableRow role="row" aria-label="company row" data-testid="row">
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </table>
    );
    const row = screen.getByTestId('row');
    expect(row.getAttribute('aria-label')).toBe('company row');
  });
});
