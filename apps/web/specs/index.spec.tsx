import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Page from '../src/app/page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Page', () => {
  it('shows the landing page to an unauthenticated user', () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    localStorage.clear();

    render(<Page />);

    expect(screen.getByText('Agricultural ERP & Compliance Platform')).toBeTruthy();
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    expect(push).not.toHaveBeenCalled();
  });
});
