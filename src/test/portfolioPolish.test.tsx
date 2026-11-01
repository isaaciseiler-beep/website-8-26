import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SiteHeader from '@/components/SiteHeader';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import NotFound from '@/pages/NotFound';

function SearchHarness() {
  const [open, setOpen] = useState(false);
  return <><div id="root"><main><button>Background action</button></main></div><SiteHeader open={false} onToggle={() => {}} searchOpen={open} onSearchOpen={() => setOpen(true)} onSearchClose={() => setOpen(false)} /></>;
}

describe('portfolio navigation and recovery', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    const values = new Map<string,string>();
    Object.defineProperty(window, 'localStorage', { configurable: true, value: { getItem: (key:string) => values.get(key) ?? null, setItem: (key:string,value:string) => values.set(key,value) } });
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); document.body.removeAttribute('data-site-search-open'); document.body.removeAttribute('data-site-sidebar-open'); });

  it('keeps covered content inert and restores the header Search trigger after Escape', async () => {
    render(<MemoryRouter><SearchHarness /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Search query' })).toHaveFocus());
    expect(document.querySelector('main')).toHaveAttribute('inert');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus());
    expect(document.querySelector('main')).not.toHaveAttribute('inert');
  });

  it('offers real destination links and marks the current route', () => {
    render(<MemoryRouter initialEntries={['/work']}><ThemeProvider><Sidebar open onToggle={() => {}} onClose={() => {}} /></ThemeProvider></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '/work');
    expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Photo Map' })).not.toHaveAttribute('aria-current');
  });

  it('exposes a Home recovery link within the normal site shell', () => {
    render(<MemoryRouter><ThemeProvider><NotFound /></ThemeProvider></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: 'Toggle menu' })).toBeInTheDocument();
  });
});
