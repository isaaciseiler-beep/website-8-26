import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import BenchmarkExplorer from '@/components/canvas/BenchmarkExplorer';
import { blankBlock, type CanvasBlock } from '@/lib/genui';
import { aiIndexStates } from '@/lib/aiStateGovIndex';

function Benchmark({ initial = blankBlock('benchmark') }: { initial?: CanvasBlock }) {
  const [block, setBlock] = useState(initial);
  return <BenchmarkExplorer block={block} onChange={setBlock} />;
}
afterEach(cleanup);

describe('benchmark exploration', () => {
  it('keeps tied ranks consistent between the ranking and scorecard', () => {
    render(<Benchmark initial={{ ...blankBlock('benchmark'), metric: 'preparednessScore' }} />);
    const arizona = screen.getByRole('button', { name: 'Inspect Arizona, score 70.0' });
    const georgia = screen.getByRole('button', { name: 'Inspect Georgia, score 70.0' });
    expect(within(arizona).getByText('03')).toBeVisible();
    expect(within(georgia).getByText('03')).toBeVisible();
    fireEvent.click(georgia);
    expect(within(screen.getByRole('article', { name: 'Georgia score' })).getByText('Rank 3 of 56')).toBeVisible();
  });

  it('uses exact nonoverlapping distribution bands, including the highest score', () => {
    render(<Benchmark initial={{ ...blankBlock('benchmark'), layout: 'benchmark-distribution', metric: 'preparednessScore', expanded: true }} />);
    const firstCount = aiIndexStates.filter(state => state.preparednessScore < 20).length;
    fireEvent.click(screen.getByRole('button', { name: `${firstCount} governments, score 0 to under 20` }));
    expect(screen.getAllByRole('button', { name: /^Inspect / })).toHaveLength(firstCount);
    expect(screen.queryByRole('button', { name: 'Inspect Montana, score 20.0' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Benchmark measure' }), { target: { value: 'compositeScore' } });
    const lastCount = aiIndexStates.filter(state => state.compositeScore >= 80).length;
    fireEvent.click(screen.getByRole('button', { name: `${lastCount} governments, score 80 to 100` }));
    expect(screen.getByRole('button', { name: 'Inspect Maryland, score 100.0' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: /^Inspect / })).toHaveLength(lastCount);
  });

  it('makes government selection alphabetical and excludes the other comparison selection', () => {
    render(<Benchmark />);
    const first = screen.getByRole('combobox', { name: 'First government' });
    const names = within(first).getAllByRole('option').slice(1).map(option => option.textContent);
    expect(names).toEqual([...names].sort((a, b) => a!.localeCompare(b!)));
    fireEvent.change(first, { target: { value: 'California' } });
    const second = screen.getByRole('combobox', { name: 'Second government' });
    expect(within(second).queryByRole('option', { name: 'California' })).not.toBeInTheDocument();
    fireEvent.change(second, { target: { value: 'Washington' } });
    expect(within(screen.getByRole('combobox', { name: 'First government' })).queryByRole('option', { name: 'Washington' })).not.toBeInTheDocument();
  });

  it('exposes criterion names and government headers as a readable evidence table', () => {
    render(<Benchmark initial={{ ...blankBlock('benchmark'), layout: 'benchmark-criteria', states: ['California', 'Washington'] }} />);
    const table = screen.getByRole('table', { name: 'Criterion breakdown' });
    expect(within(table).getAllByRole('columnheader').map(header => header.textContent)).toEqual(['Evidence', 'California', 'Washington']);
    const sandbox = within(table).getByRole('rowheader', { name: 'Sandbox' }).closest('[role=row]')!;
    expect(within(sandbox as HTMLElement).getByRole('cell', { name: 'California: 2 of 2' })).toBeVisible();
    expect(within(table).getAllByRole('row')).toHaveLength(16);
  });
});
