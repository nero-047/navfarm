import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Page from '../src/app/page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Page', () => {
  it('sends an unauthenticated user to login', () => {
    const replace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace });
    localStorage.clear();

    render(<Page />);

    expect(screen.getByText('Opening your workspace…')).toBeTruthy();
    expect(replace).toHaveBeenCalledWith('/login');
  });

  it('sends an authenticated user to company selection', () => {
    const replace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace });
    localStorage.setItem('navfarm_auth_user', JSON.stringify({ email: 'demo@navfarm.com' }));

    render(<Page />);

    expect(replace).toHaveBeenCalledWith('/company-selection');
  });
});
