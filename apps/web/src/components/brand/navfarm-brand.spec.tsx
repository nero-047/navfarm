import { render, screen } from '@testing-library/react';
import { NavfarmBrand } from './navfarm-brand';

describe('NavfarmBrand', () => {
  it('uses the verified local mark with alternative text', () => {
    render(<NavfarmBrand />);
    expect(screen.getByRole('img', { name: 'NAVFarm icon' }).getAttribute('src')).toBe('/favicon.ico');
    expect(screen.getByText(/NAV/)).not.toBeNull();
  });

  it('keeps the official mark visible in compact navigation', () => {
    render(<NavfarmBrand compact inverse />);
    expect(screen.getByRole('img', { name: 'NAVFarm icon' })).not.toBeNull();
    expect(screen.queryByText(/NAV/)).toBeNull();
  });
});
