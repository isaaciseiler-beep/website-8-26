import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { SearchPanel } from '@/components/SearchOverlay';
import type { SearchGroup } from '@/lib/searchIndex';

afterEach(cleanup);

it('keeps one persistent status region through waiting, results, empty and closed states', () => {
  const groups: SearchGroup[] = [{ category: 'projects', label: 'Work', results: [{
    id: 'taiwan', category: 'projects', title: 'Taiwan', subtitle: '', description: '',
    href: '/projects/fulbright-focus-group-sponsored-by-openai', topics: [], tags: [], keywords: [], score: 1, reason: '',
  }] }];
  const props = { groups: [] as SearchGroup[], hasQuery: true, hasResults: false, open: true, searchReady: false, onSelect: vi.fn() };
  const view = render(<MemoryRouter><SearchPanel {...props}/></MemoryRouter>);
  const status = screen.getByRole('status');
  expect(status).toHaveTextContent('Searching…');
  view.rerender(<MemoryRouter><SearchPanel {...props} groups={groups} hasResults searchReady/></MemoryRouter>);
  expect(screen.getByRole('status')).toBe(status);
  expect(status).toHaveTextContent('1 result available.');
  view.rerender(<MemoryRouter><SearchPanel {...props} searchReady/></MemoryRouter>);
  expect(screen.getByRole('status')).toBe(status);
  expect(status).toHaveTextContent('No matches. Try a project, topic, or location.');
  expect(screen.getAllByRole('status')).toHaveLength(1);
  view.rerender(<MemoryRouter><SearchPanel {...props} open={false} searchReady/></MemoryRouter>);
  expect(status).toBeEmptyDOMElement();
});
