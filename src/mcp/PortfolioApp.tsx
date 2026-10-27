import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@modelcontextprotocol/ext-apps';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import ExplorationCanvas from '../components/canvas/ExplorationCanvas';
import { applyPortfolioAction, changeHistory, createPortableView, encodeView, readPortableView, travelHistory, viewPlan, viewUrl, type PortableView, type ViewHistory } from '../lib/portfolioView';
import { SITE_URL } from '../lib/site';
import type { Composition } from '../lib/genui';
import './portfolio-app.css';

export default function PortfolioApp() {
  const [history, setHistory] = useState<ViewHistory<PortableView> | null>(null);
  const current = useRef<ViewHistory<PortableView> | null>(null);
  const [error, setError] = useState('');
  const app = useRef<App>();
  const localRevision = useRef(0);
  const inputRevision = useRef(0);
  const notify = (view: PortableView) => {
    void app.current?.updateModelContext({ structuredContent: { view, shareUrl: viewUrl(view, SITE_URL) } }).catch(() => {});
  };
  useEffect(() => {
    const bridge = new App({ name: 'Isaac Seiler portfolio', version: '1.0.0' }, {}, { autoResize: true });
    app.current = bridge;
    const theme = (value?: string) => document.documentElement.classList.toggle('dark', value === 'dark');
    bridge.onhostcontextchanged = context => theme(context.theme);
    bridge.ontoolinput = () => { inputRevision.current = localRevision.current; };
    bridge.ontoolresult = result => {
      try {
        if (result.isError) throw new Error('The requested view could not be opened.');
        const payload = result.structuredContent;
        const view = readPortableView(payload?.view);
        if (current.current && (inputRevision.current !== localRevision.current || (payload?.basedOn && payload.basedOn !== encodeView(current.current.present)))) {
          setError('Kept your latest changes. Ask again to update this view.'); return;
        }
        const next = current.current ? changeHistory(current.current, view) : { past: [], present: view, future: [] };
        current.current = next; setHistory(next); setError('');
      } catch { setError('This view could not be loaded. Ask your assistant to open it again.'); }
    };
    void bridge.connect().then(() => theme(bridge.getHostContext()?.theme)).catch(() => setError('Open this view through an MCP Apps-compatible assistant.'));
    return () => { void bridge.close(); };
  }, []);
  function change(composition: Composition) {
    if (!current.current) return;
    const view = createPortableView(composition);
    const next = changeHistory(current.current, view);
    current.current = next; setHistory(next); localRevision.current++; setError(''); notify(view);
  }
  function travel(direction: 'back' | 'forward') {
    if (!current.current) return;
    const next = travelHistory(current.current, direction);
    current.current = next; setHistory(next); localRevision.current++; setError(''); notify(next.present);
  }
  const view = history?.present;
  return <main className="home-genui portfolio-app" onClick={event => {
    const anchor = (event.target as HTMLElement).closest('a');
    if (!anchor) return;
    event.preventDefault();
    void app.current?.openLink({ url: new URL(anchor.getAttribute('href')!, SITE_URL).toString() }).catch(() => setError('Your assistant could not open this link.'));
  }}>
    <div className="home-genui-stage">
      {view ? <>
        <div className="home-genui-tools">
          <div className="home-view-history">
            {history.past.length > 0 && <button aria-label="Back" onClick={() => travel('back')}><ArrowLeft size={15} />Back</button>}
            {history.future.length > 0 && <button aria-label="Forward" onClick={() => travel('forward')}><ArrowRight size={15} /></button>}
          </div>
          <button onClick={() => void app.current?.openLink({ url: viewUrl(view, SITE_URL) }).catch(() => setError('Your assistant could not open the website.'))}>Continue on website<ArrowUpRight size={15} /></button>
        </div>
        <ExplorationCanvas composition={view.composition} plan={viewPlan(view)} generation={{ status: 'authored' }} onChange={change} onAction={action => change(applyPortfolioAction(view, action).composition)} />
      </> : <p>Opening the portfolio…</p>}
      {error && <p role="status">{error}</p>}
    </div>
  </main>;
}

createRoot(document.getElementById('root')!).render(<PortfolioApp />);
