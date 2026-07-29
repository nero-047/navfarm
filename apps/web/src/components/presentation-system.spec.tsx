import { fireEvent, render, screen } from '@testing-library/react';
import { useTheme } from '../hooks/useTheme';
import ThemeToggle from './source-ui/theme-toggle';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from './phase2/common';
import { SCOPE_PRESENTATION, scopeLabel } from './shell/scope-presentation';

jest.mock('../hooks/useTheme', () => ({
  useTheme: jest.fn(),
}));

const mockedUseTheme = jest.mocked(useTheme);

describe('Milestone 4 presentation system', () => {
  it('uses stable, explicit labels for every application scope', () => {
    expect(scopeLabel('platform')).toBe('Platform administration');
    expect(scopeLabel('tenant')).toBe('Tenant administration');
    expect(scopeLabel('company')).toBe('Company administration');
    expect(scopeLabel('workspace')).toBe('Workspace operations');
    expect(SCOPE_PRESENTATION.tenant.description).toBe('Tenant console');
  });

  it('exposes the persisted theme choice as a named pressed control', () => {
    const toggleTheme = jest.fn();
    mockedUseTheme.mockReturnValue({ theme: 'dark', toggleTheme });
    render(<ThemeToggle />);

    const toggle = screen.getByRole('button', { name: 'Use light theme' });
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.className).toContain('var(--surface-raised)');
    fireEvent.click(toggle);
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  it('renders semantic headings and announced loading, error, and empty states', () => {
    const retry = jest.fn();
    const { rerender } = render(
      <PageHeader
        eyebrow="Company administration"
        title="Company members"
        description="Manage company roles."
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'Company members', level: 1 }),
    ).not.toBeNull();

    rerender(<LoadingState label="Loading company members…" />);
    expect(screen.getByRole('status').textContent).toContain(
      'Loading company members',
    );

    rerender(<ErrorState message="Request failed." onRetry={retry} />);
    expect(screen.getByRole('alert').textContent).toContain('Request failed.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledTimes(1);

    rerender(
      <EmptyState
        title="No members yet"
        description="Invite a company member."
      />,
    );
    expect(screen.getByText('No members yet')).not.toBeNull();
  });
});
