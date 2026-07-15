import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Page from '../src/app/page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Page', () => {
  it('redirects an unauthenticated user to login', async () => {
    const replace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace });
    localStorage.clear();

    render(<Page />);

    expect(screen.getByText('Redirecting...')).toBeTruthy();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
  });
});
