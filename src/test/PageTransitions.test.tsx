import { lazy } from 'react';
import SiteChromeProvider from '@/components/SiteChromeProvider';
import { useSidebarState } from '@/lib/siteChrome';
import SiteHeader from '@/components/SiteHeader';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import HomeExplore from '@/components/canvas/HomeExplore';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PageTransitions from '@/components/PageTransitions';
import useProjectReturn from '@/hooks/useProjectReturn';
import { readNavigationPosition, saveNavigationPosition } from '@/lib/navigationScroll';

const { warm } = vi.hoisted(() => ({ warm: vi.fn((_path: string) => Promise.resolve()) }));
vi.mock('@/lib/routePreload', () => ({ warmRoute: warm }));
function Page({ name }: { name: string }) {
  const navigate = useNavigate();
  return <main><h1>{name}</h1><Link to="/work">Work</Link><Link to="/writing">Writing</Link><button onClick={() => navigate(-1)}>Browser back</button></main>;
}
function Harness() {
  return <MemoryRouter initialEntries={['/']}><PageTransitions>{location => <Routes location={location}>
    <Route path="/" element={<Page name="Home" />} /><Route path="/work" element={<Page name="Work index" />} /><Route path="/writing" element={<Page name="Writing page" />} />
  </Routes>}</PageTransitions></MemoryRouter>;
}
beforeEach(() => { warm.mockReset().mockResolvedValue(undefined); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); delete (document as Document & {startViewTransition?:unknown}).startViewTransition; });

describe('route handoff', () => {
  it('retains the previous page until ready, and rejects a superseded destination', async () => {
    let release!: () => void;
    warm.mockImplementation(path => path === '/work' ? new Promise<void>(resolve => { release = resolve; }) : Promise.resolve());
    render(<Harness />);
    fireEvent.click(screen.getByRole('link', { name: 'Work' }));
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Writing' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Writing page' })).toBeInTheDocument());
    await act(async () => { release(); });
    expect(screen.queryByRole('heading', { name: 'Work index' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
    await act(async () => { release(); });
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Work index' })).toBeInTheDocument());
  });

  it('keeps navigation live instead of snapshotting forward and back', async () => {
    const start = vi.fn();
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start });
    render(<Harness />);
    fireEvent.click(screen.getByRole('link', { name: 'Work' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Work index' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument());
    expect(start).not.toHaveBeenCalled();
  });
});

it('keeps separate positions for repeated visits to the same URL', () => {
  const first = { key: 'first-work', pathname: '/work', search: '' };
  const second = { ...first, key: 'second-work' };
  vi.spyOn(window, 'scrollY', 'get').mockReturnValueOnce(800).mockReturnValueOnce(120);
  saveNavigationPosition(first); saveNavigationPosition(second);
  expect(readNavigationPosition(first)?.y).toBe(800);
  expect(readNavigationPosition(second)?.y).toBe(120);
});

it('returns to the actual Work history entry, with /work as the direct-link fallback', async () => {
  function Detail() {
    const { back } = useProjectReturn();
    return <button onClick={back}>Back to work</button>;
  }
  function RouteName() { return <p>{useLocation().pathname}</p>; }
  const view = render(<MemoryRouter initialEntries={['/work', { pathname: '/projects/example', state: { fromWork: true } }]} initialIndex={1}><RouteName /><Detail /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Back to work' }));
  expect(screen.getByText('/work')).toBeInTheDocument();
  view.unmount();
  render(<MemoryRouter initialEntries={['/projects/example']}><RouteName /><Detail /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Back to work' }));
  expect(screen.getByText('/work')).toBeInTheDocument();
});

it('keeps the live page visible while a destination suspends, without a loading flash', async () => {
  let load!: (module: {default: () => JSX.Element}) => void;
  const Slow = lazy(() => new Promise<{default: () => JSX.Element}>(resolve => { load = resolve; }));
  render(<MemoryRouter><PageTransitions>{location=><Routes location={location}>
    <Route path="/" element={<Page name="Home"/>}/><Route path="/work" element={<Slow/>}/>
  </Routes>}</PageTransitions></MemoryRouter>);
  fireEvent.click(screen.getByRole('link',{name:'Work'}));
  await waitFor(() => expect(load).toBeDefined());
  expect(screen.getByRole('heading', { name: 'Home' })).toBeVisible();
  expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
  await act(async()=>{load({default:()=> <main>Ready destination</main>});});
  await waitFor(()=>expect(screen.getByText('Ready destination')).toBeInTheDocument());
});

it('does not take a snapshot when reduced motion is enabled', async () => {
  vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener(){},removeEventListener(){}}));
  const start=vi.fn();
  Object.defineProperty(document,'startViewTransition',{configurable:true,value:start});
  render(<Harness/>);
  fireEvent.click(screen.getByRole('link',{name:'Work'}));
  await waitFor(()=>expect(screen.getByRole('heading',{name:'Work index'})).toBeInTheDocument());
  expect(start).not.toHaveBeenCalled();
});

it('restores the committed exploration, local metric and unfinished draft on browser Back', async () => {
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({configured:false})})));
  render(<MemoryRouter><PageTransitions>{location=><Routes location={location}>
    <Route path="/" element={<main><HomeExplore/><Link to="/writing">Open writing</Link></main>}/>
    <Route path="/writing" element={<Page name="Writing page"/>}/>
  </Routes>}</PageTransitions></MemoryRouter>);
  const input=screen.getByRole('textbox',{name:'Explore'});
  fireEvent.change(input,{target:{value:'Compare California and Washington'}});
  await act(async()=>{fireEvent.submit(input.closest('form')!);});
  fireEvent.change(screen.getByRole('combobox',{name:'Benchmark measure'}),{target:{value:'preparednessScore'}});
  fireEvent.change(input,{target:{value:'An unfinished draft'}});
  fireEvent.click(screen.getByRole('link',{name:'Open writing'}));
  await waitFor(()=>expect(screen.getByRole('heading',{name:'Writing page'})).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button',{name:'Browser back'}));
  await waitFor(()=>expect(screen.getByRole('heading',{name:'Government comparison'})).toBeInTheDocument());
  expect(screen.getByRole('textbox',{name:'Explore'})).toHaveValue('An unfinished draft');
  expect(screen.getByRole('combobox',{name:'Benchmark measure'})).toHaveValue('preparednessScore');
});


it.each([1280, 768, 767, 390])('retains a desktop sidebar and reveals the destination under a full-width menu at %ipx', async (width) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  const values = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } });
  let release!: () => void;
  warm.mockImplementation(path => path === '/work' ? new Promise<void>(resolve => { release = resolve; }) : Promise.resolve());
  function WithChrome({ name }: { name: string }) {
    const [open, setOpen] = useSidebarState();
    return <>
      <Sidebar open={open} onToggle={() => setOpen(value => !value)} onClose={() => setOpen(false)} showToggle={false} />
      <div id="root"><main><h1>{name}</h1></main></div>
      <SiteHeader open={open} onToggle={() => setOpen(value => !value)} searchOpen={false} />
    </>;
  }
  render(<MemoryRouter><ThemeProvider><SiteChromeProvider><PageTransitions>{location => <Routes location={location}>
    <Route path="/" element={<WithChrome key="home" name="Home" />} /><Route path="/work" element={<WithChrome key="destination" name="Destination" />} />
  </Routes>}</PageTransitions></SiteChromeProvider></ThemeProvider></MemoryRouter>);
  const header = screen.getByRole('button', { name: 'Toggle menu' });
  fireEvent.click(header);
  const sidebar = screen.getByRole('navigation', { name: 'Main navigation' });
  fireEvent.click(screen.getByRole('link', { name: 'Work' }));
  expect(screen.getByRole('heading', { name: 'Home' })).toBeVisible();
  expect(sidebar).not.toHaveAttribute('inert');
  expect(sidebar).toBeInTheDocument();
  expect(document.body.hasAttribute('data-sidebar-navigation-fade')).toBe(width < 768);
  await act(async () => { release(); });
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Destination' })).toBeVisible());
  expect(document.querySelector('[data-site-overlay="sidebar"]')).toBe(sidebar);
  expect(screen.getByRole('button', { name: 'Toggle menu' })).toBe(header);
  if (width < 768) {
    await waitFor(() => expect(header).toHaveAttribute('aria-expanded', 'false'));
    expect(sidebar).toHaveAttribute('inert');
    await waitFor(() => expect(document.querySelector('main')).not.toHaveAttribute('inert'));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Destination' })).toHaveFocus());
  } else {
    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(sidebar).not.toHaveAttribute('inert');
    fireEvent.click(header);
    expect(sidebar).toHaveAttribute('inert');
    expect(document.querySelector('main')).not.toHaveAttribute('inert');
  }
});

it('restores an expanded help explanation and draft when returning to the same history entry',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({configured:false})})));
  render(<MemoryRouter><PageTransitions>{location=><Routes location={location}>
    <Route path="/" element={<main><HomeExplore/><Link to="/writing">Open writing</Link></main>}/>
    <Route path="/writing" element={<Page name="Writing page"/>}/>
  </Routes>}</PageTransitions></MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:'How to explore'}));
  const technical=screen.getByText('Technical details',{exact:true}).closest('details')!;
  technical.open=true;
  fireEvent.change(screen.getByRole('textbox',{name:'Explore'}),{target:{value:'My next question is still a draft'}});
  fireEvent.click(screen.getByRole('link',{name:'Open writing'}));
  await waitFor(()=>expect(screen.getByRole('heading',{name:'Writing page'})).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button',{name:'Browser back'}));
  await waitFor(()=>expect(screen.getByRole('heading',{name:'Start with a little curiosity.'})).toBeInTheDocument());
  expect(screen.getByText('Technical details',{exact:true}).closest('details')!.open).toBe(true);
  expect(screen.getByRole('textbox',{name:'Explore'})).toHaveValue('My next question is still a draft');
});
