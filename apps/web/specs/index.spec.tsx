import React from 'react';
import { render } from '@testing-library/react';
import Page from '../src/app/page';

describe('Page', () => {
  it('should render successfully', () => {
    const { getByRole } = render(<Page />);
    expect(
      getByRole('heading', { level: 1, name: 'Welcome to NAVFarm' }),
    ).toBeTruthy();
  });
});
