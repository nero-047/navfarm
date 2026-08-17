import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../src/components/ui/button';

describe('Button', () => {
  it('renders the default variant (source-ui "primary" maps here)', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.className).toContain('bg-(--accent)');
    expect(button.className).toContain('rounded-[var(--radius-pill)]');
  });

  it('renders the destructive variant (source-ui "danger" maps here)', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button.className).toContain('bg-(--danger)');
  });

  it('renders the outline variant', () => {
    render(<Button variant="outline">Cancel</Button>);
    const button = screen.getByRole('button', { name: 'Cancel' });
    expect(button.className).toContain('border-(--border)');
    expect(button.className).toContain('bg-(--surface)');
  });

  it('renders the ghost variant', () => {
    render(<Button variant="ghost">Dismiss</Button>);
    const button = screen.getByRole('button', { name: 'Dismiss' });
    expect(button.className).toContain('text-(--text-secondary)');
  });

  it('preserves disabled behavior and blocks click handlers', () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Submit
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Submit' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('carries a visible focus-visible ring so keyboard focus is never invisible', () => {
    render(<Button>Focus me</Button>);
    const button = screen.getByRole('button', { name: 'Focus me' });
    expect(button.className).toContain('focus-visible:ring-2');
  });

  it('forwards type, className, and native event handlers', () => {
    const onClick = jest.fn();
    render(
      <Button type="submit" className="mt-4 self-end" onClick={onClick}>
        Continue
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement;
    expect(button.type).toBe('submit');
    expect(button.className).toContain('mt-4');
    expect(button.className).toContain('self-end');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
