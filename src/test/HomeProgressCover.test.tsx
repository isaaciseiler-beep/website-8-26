import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HomeProgressCover from '@/components/canvas/HomeProgressCover';

vi.mock('@/hooks/useMotionPreference', () => ({ useMotionPreference: () => false }));

afterEach(() => { cleanup(); vi.useRealTimers(); });

it('boots inside the Macintosh for 4.8 seconds, then keeps the work link ready on return', () => {
  vi.useFakeTimers();
  const view = render(<MemoryRouter><HomeProgressCover /></MemoryRouter>);
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'View work' })).not.toBeInTheDocument();
  act(() => { vi.advanceTimersByTime(1900); });
  expect(screen.getByRole('img', { name: 'Welcome to Macintosh.' })).toBeInTheDocument();
  act(() => { vi.advanceTimersByTime(2899); });
  expect(screen.getByRole('status')).toBeInTheDocument();
  act(() => { vi.advanceTimersByTime(1); });
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Macintosh SE screen' })).toContainElement(screen.getByText('This part of the site is a work in progress'));
  expect(screen.getByRole('link', { name: 'View work' })).toHaveAttribute('href', '/work');
  view.unmount();
  render(<MemoryRouter><HomeProgressCover /></MemoryRouter>);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View work' })).toBeInTheDocument();
});
