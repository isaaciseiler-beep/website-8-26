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
    render(<MemoryRouter initialEntries={['/photos']}><ThemeProvider><Sidebar open onToggle={() => {}} onClose={() => {}} /></ThemeProvider></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Photos' })).toHaveAttribute('href', '/photos');
    expect(screen.getByRole('link', { name: 'Photos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Work' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Photo Map' })).not.toBeInTheDocument();
  });

  it('keeps the search glyph and entered results stable when a close is interrupted', async () => {
    render(<MemoryRouter><SearchHarness /></MemoryRouter>);
    const trigger = screen.getByRole('button', { name: 'Search' });
    const glyph = trigger.querySelector('svg');
    fireEvent.click(trigger);
    const input = await screen.findByRole('textbox', { name: 'Search query' });
    fireEvent.change(input, { target: { value: 'Taiwan' } });
    fireEvent.click(screen.getByRole('button', { name: 'Close search' }));
    // Exiting controls cannot receive keyboard focus, while their text stays
    // intact for the visible fold. Reopening reverses that same surface.
    expect(input.closest('form')).toHaveAttribute('inert');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(input).toHaveValue('Taiwan');
    expect(screen.getByRole('button', { name: 'Search' }).querySelector('svg')).toBe(glyph);
    fireEvent.click(trigger);
    expect(screen.getByRole('textbox', { name: 'Search query' })).toBe(input);
    expect(input).toHaveValue('Taiwan');
    expect(input.closest('form')).not.toHaveAttribute('inert');
  });

  it('exposes a Home recovery link within the normal site shell', () => {
    render(<MemoryRouter><ThemeProvider><NotFound /></ThemeProvider></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: 'Toggle menu' })).toBeInTheDocument();
  });
});
