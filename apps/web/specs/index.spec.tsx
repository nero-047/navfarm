import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../src/contexts/AuthContext';
import Page from '../src/app/page';

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('../src/contexts/AuthContext', () => ({ useAuth: jest.fn() }));

describe('protected root route', () => {
  it('sends an unauthenticated user to login', () => {
    const replace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace });
    (useAuth as jest.Mock).mockReturnValue({ session: null, loading: false });
    render(<Page />);
    expect(screen.getByText('Opening your secure workspace…')).toBeTruthy();
    expect(replace).toHaveBeenCalledWith('/login');
  });

  it('waits for session loading before redirecting', () => {
    const replace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace });
    (useAuth as jest.Mock).mockReturnValue({ session: null, loading: true });
    render(<Page />);
    expect(replace).not.toHaveBeenCalled();
  });
});
