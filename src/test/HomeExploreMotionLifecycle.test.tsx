import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HomeExplore from '@/components/canvas/HomeExplore';

const observers: { target: Element | null; notify: () => void; disconnected: boolean }[] = [];
let contentHeight = 420;
let reduced = true;
const preferenceListeners = new Set<() => void>();
const success = (data: unknown) => ({ ok: true, json: async () => data });
async function submit(text: string) {
  const input = screen.getByRole('combobox', { name: 'Explore' });
  fireEvent.change(input, { target: { value: text } });
  await act(async () => { fireEvent.submit(input.closest('form')!); });
}
const mount = () => render(<MemoryRouter><HomeExplore /></MemoryRouter>);
const reveal = () => document.querySelector<HTMLElement>('.home-genui-reveal')!;
const notifyContentResize = () => {
  for (const observer of observers) if (!observer.disconnected && observer.target?.classList.contains('home-genui-reveal-content')) observer.notify();
};

beforeEach(() => {
  contentHeight = 420; reduced = true; observers.length = 0; preferenceListeners.clear();
  vi.stubGlobal('fetch', vi.fn(async () => success({ configured: false })));
  vi.stubGlobal('matchMedia', () => ({ get matches() { return reduced; }, addEventListener: (_event: string, fn: () => void) => preferenceListeners.add(fn), removeEventListener: (_event: string, fn: () => void) => preferenceListeners.delete(fn) }));
  vi.stubGlobal('ResizeObserver', class {
    record: typeof observers[number];
    constructor(callback: ResizeObserverCallback) { this.record = { target: null, notify: () => callback([], this as unknown as ResizeObserver), disconnected: false }; observers.push(this.record); }
    observe(target: Element) { this.record.target = target; }
    unobserve() {}
    disconnect() { this.record.disconnected = true; }
  });
  const actual = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.classList.contains('home-genui-reveal-content')) return { x: 0, y: 0, top: 0, left: 0, right: 700, bottom: contentHeight, width: 700, height: contentHeight, toJSON() {} };
    return actual.call(this);
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Explore motion preserves an immediately usable interface', () => {
  it('tracks late growth and shrink without remounting interactive content', async () => {
    mount(); await submit('Explore all projects');
    const search = screen.getByRole('searchbox', { name: 'Find a project' });
    fireEvent.change(search, { target: { value: 'Taiwan' } });
    await waitFor(() => expect(reveal().style.height).toBe('420px'));
    for (const height of [810, 160, 560]) {
      contentHeight = height;
      act(notifyContentResize);
      await waitFor(() => expect(reveal().style.height).toBe(`${height}px`));
      expect(screen.getByRole('searchbox', { name: 'Find a project' })).toBe(search);
      expect(search).toHaveValue('Taiwan');
      expect(screen.getByRole('button', { name: /Leading AI Literacy Efforts in Taiwan/ })).toBeVisible();
    }
  });

  it('uses the latest measured content after bursty image or disclosure resizes', async () => {
    mount(); await submit('Taiwan teaching');
    contentHeight = 700; act(notifyContentResize);
    contentHeight = 980; act(notifyContentResize);
    contentHeight = 250; act(notifyContentResize);
    await waitFor(() => expect(reveal().style.height).toBe('250px'));
    expect(screen.getByRole('heading', { name: 'AI literacy in Taiwan' })).toBeVisible();
    expect(document.querySelectorAll('.home-genui-reveal')).toHaveLength(1);
  });

  it('can clear and immediately submit a different subject without resurrecting the old pane', async () => {
    reduced = false;
    mount(); await submit('Taiwan teaching');
    await waitFor(() => expect(parseFloat(reveal().style.height)).toBeGreaterThan(100));
    fireEvent.click(screen.getByRole('button', { name: 'Clear exploration' }));
    expect(reveal()).toHaveAttribute('data-state', 'closing');
    expect(reveal()).toHaveAttribute('aria-hidden', 'true');
    expect(reveal()).toHaveAttribute('inert');
    expect(document.querySelector('.home-genui-window')).toHaveClass('has-results');
    expect(screen.getByRole('combobox', { name: 'Explore' })).toHaveFocus();
    await submit('How can I contact Isaac?');
    expect(screen.getByRole('region', { name: 'Contact' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'AI literacy in Taiwan' })).not.toBeInTheDocument();
    await waitFor(() => expect(document.querySelectorAll('.home-genui-reveal')).toHaveLength(1));
    expect(reveal()).not.toHaveAttribute('aria-hidden', 'true');
    expect(reveal()).not.toHaveAttribute('inert');
    expect(screen.queryByRole('button', { name: 'Undo clear' })).not.toBeInTheDocument();
  });

  it('restores selected controls after a completed fold and Undo clear', async () => {
    mount(); await submit('Compare Michigan and California');
    fireEvent.change(screen.getByRole('combobox', { name: 'Benchmark measure' }), { target: { value: 'preparednessScore' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear exploration' }));
    const undo = await screen.findByRole('button', { name: 'Undo clear' });
    fireEvent.click(undo);
    expect(screen.getByRole('combobox', { name: 'Benchmark measure' })).toHaveValue('preparednessScore');
    expect(screen.getByRole('combobox', { name: 'First government' })).toHaveValue('Michigan');
    expect(screen.getByRole('combobox', { name: 'Second government' })).toHaveValue('California');
    expect(reveal()).not.toHaveAttribute('inert');
    expect(screen.getByRole('combobox', { name: 'Explore' })).toHaveFocus();
  });

  it('replaces a long answer with usable guidance in the same measured pane', async () => {
    mount(); await submit('Taiwan teaching');
    const pane = reveal();
    contentHeight = 150;
    await submit('hello');
    act(notifyContentResize);
    await waitFor(() => expect(reveal().style.height).toBe('150px'));
    expect(reveal()).toBe(pane);
    expect(screen.queryByRole('heading', { name: 'AI literacy in Taiwan' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore the work' })).toBeVisible();
    expect(pane).not.toHaveAttribute('inert');
    fireEvent.click(screen.getByRole('button', { name: 'Explore the work' }));
    expect(await screen.findByRole('region', { name: 'Work explorer' })).toBeVisible();
  });

  it('can switch to reduced motion while open, clear, and reopen without a stranded exit', async () => {
    reduced = false;
    mount(); await submit('Taiwan teaching');
    await act(async () => { reduced = true; preferenceListeners.forEach(notify => notify()); });
    fireEvent.click(screen.getByRole('button', { name: 'Clear exploration' }));
    await waitFor(() => expect(document.querySelector('.home-genui-stage')).not.toBeInTheDocument());
    await submit('Explore Isaac’s career');
    expect(screen.getByRole('region', { name: 'Role explorer' })).toBeVisible();
    expect(reveal()).not.toHaveAttribute('inert');
  });

  it('does not carry a pending history disclosure restore into a newly submitted subject', async () => {
    reduced = false;
    mount(); await submit('Taiwan teaching');
    await waitFor(() => expect(parseFloat(reveal().style.height)).toBeGreaterThan(100));
    const source = screen.getByRole('region', { name: 'Project explorer' }).querySelector<HTMLDetailsElement>('details.canvas-sources')!;
    source.open = true;
    await submit('How can I contact Isaac?');
    fireEvent.click(screen.getByRole('button', { name: 'Previous exploration' }));
    await submit('Boehringer rebrand');
    expect(screen.getByRole('heading', { name: 'Bringing Boehringer Cares to life' })).toBeVisible();
    const newSources = screen.getByRole('region', { name: 'Project explorer' }).querySelector<HTMLDetailsElement>('details.canvas-sources')!;
    expect(newSources).not.toHaveAttribute('open');
  });

  it('lets a manual refinement supersede pending history disclosure restoration', async () => {
    reduced = false;
    mount(); await submit('Taiwan teaching');
    await waitFor(() => expect(parseFloat(reveal().style.height)).toBeGreaterThan(100));
    const further = () => screen.getByText('Explore further', { selector: 'summary' }).closest('details')!;
    further().open = true;
    await submit('How can I contact Isaac?');
    fireEvent.click(screen.getByRole('button', { name: 'Previous exploration' }));
    expect(further()).toHaveAttribute('open');
    further().open = false;
    fireEvent.click(screen.getByRole('button', { name: 'Process' }));
    expect(further()).not.toHaveAttribute('open');
  });

  it('disconnects all geometry and media listeners when navigation unmounts the pane', async () => {
    const view = mount(); await submit('Taiwan teaching');
    expect(observers.some(observer => observer.target?.classList.contains('home-genui-reveal-content'))).toBe(true);
    view.unmount();
    expect(observers.every(observer => observer.disconnected)).toBe(true);
    expect(preferenceListeners.size).toBe(0);
  });
});
