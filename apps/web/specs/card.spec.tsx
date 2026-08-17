import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card } from '../src/components/ui/card';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <p>Corporate Directory</p>
      </Card>
    );
    expect(screen.getByText('Corporate Directory')).toBeTruthy();
  });

  it('preserves className, merging conflicting utilities deterministically', () => {
    // Regression guard for the source-ui migration: source-ui/card composed
    // classes by string concatenation, so a caller's `p-0` only beat the
    // built-in `p-6` by accident of stylesheet order. Canonical Card resolves
    // this with tailwind-merge, so it must always be deterministic.
    render(
      <Card className="p-0 overflow-hidden" data-testid="card">
        content
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card.className).toContain('p-0');
    expect(card.className).not.toMatch(/(?<!\S)p-6(?!\S)/);
    expect(card.className).toContain('overflow-hidden');
  });

  it('forwards arbitrary HTML attributes', () => {
    render(
      <Card role="dialog" aria-modal="true" data-testid="card">
        content
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card.getAttribute('role')).toBe('dialog');
    expect(card.getAttribute('aria-modal')).toBe('true');
  });

  it('sets a default text color so contents do not inherit ambient color', () => {
    render(<Card data-testid="card">content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('text-(--text-primary)');
  });
});
