import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { publicProjects } from '@/lib/canvas';
import { AI_LAYOUTS, defaultLayout } from '@/lib/layouts';
import type { Composition } from '@/lib/genui';
import type { PortfolioAction } from '@/lib/portfolioView';

export default function ViewCompositionControls({ composition, onAction }: { composition: Composition; onAction: (action: PortfolioAction) => void }) {
  const ids = [...new Set(composition.blocks.flatMap(block => block.projectIds))];
  return <details className="canvas-arrangement">
    <summary>Adjust view</summary>
    <div className="canvas-arrangement-controls">
      {composition.blocks.map((block, index) => <div className="canvas-arrangement-row" key={index}>
        <label><span className="sr-only">View {index + 1} layout</span><select aria-label={`View ${index + 1} layout`} value={block.layout ?? defaultLayout[block.kind]} onChange={event => {
          const layout = event.target.value as NonNullable<typeof block.layout>;
          const states = block.kind === 'benchmark' && ['benchmark-ranking', 'benchmark-regions', 'benchmark-distribution'].includes(layout) ? [] : block.states;
          onAction({ type: 'update_module', index, changes: { layout, states } });
        }}>{AI_LAYOUTS.filter(layout => layout.kind === block.kind && (layout.id !== 'benchmark-compare' || block.states.length === 2) && (layout.id !== 'benchmark-scorecard' || block.states.length === 1)).map(layout => <option key={layout.id} value={layout.id}>{layout.name}</option>)}</select></label>
        {composition.blocks.length > 1 && <div className="canvas-arrangement-actions">
          <button aria-label={`Move view ${index + 1} up`} disabled={index === 0} onClick={() => onAction({ type: 'move_module', from: index, to: index - 1 })}><ArrowUp size={14} /></button>
          <button aria-label={`Move view ${index + 1} down`} disabled={index === composition.blocks.length - 1} onClick={() => onAction({ type: 'move_module', from: index, to: index + 1 })}><ArrowDown size={14} /></button>
          <button aria-label={`Remove view ${index + 1}`} onClick={() => onAction({ type: 'remove_module', index })}><X size={14} /></button>
        </div>}
      </div>)}
      {composition.blocks.length < 3 && <label><span className="sr-only">Add a project to this view</span><select aria-label="Add a project to this view" value="" onChange={event => { if (event.target.value) onAction({ type: 'open_project', projectId: event.target.value, append: true }); }}><option value="">Add a project…</option>{publicProjects.filter(project => !ids.includes(project.id)).map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>}
      {ids.length === 2 && composition.blocks.every(block => block.kind === 'story') && <button className="portfolio-inline-action" onClick={() => onAction({ type: 'compare_projects', projectIds: [ids[0], ids[1]] })}>Compare these projects</button>}
    </div>
  </details>;
}
