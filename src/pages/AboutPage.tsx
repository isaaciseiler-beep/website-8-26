import { useSidebarState } from "@/lib/siteChrome";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './about-page.css';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import SiteHeader from '@/components/SiteHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigationMotion } from '@/hooks/useMotionPreference';
import { PROFILE_SUMMARY } from '@/lib/siteIdentity.mjs';
import { albums, coverFor } from '@/lib/photoAlbums';
import { experienceEntries } from '@/lib/experience';
import { hiddenProjectIds, projectItems } from '@/lib/siteContent';

const AREAS = ['AI', 'public policy', 'education', 'research', 'journalism', 'communications'] as const;
const AREA_PHRASE = 'AI, public policy, education, research, journalism, and communications';
const seattleCover = coverFor(albums.find(album => album.folder === 'washington-state')!);
const publishedCount = projectItems.filter(project => !hiddenProjectIds.has(project.id)).length;
const roleFor = (id: string) => experienceEntries.find(entry => entry.id === id || entry.projectIds.includes(id));
const projectImage = (id: string) => projectItems.find(project => project.id === id)?.image ?? '';

function placePreview(chip: HTMLElement) {
  const anchor = chip.querySelector('a');
  const preview = chip.querySelector<HTMLElement>('.about-preview');
  if (!anchor || !preview) return;
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(220, window.innerWidth - 24);
  const height = preview.offsetHeight || 140;
  let left = rect.left;
  if (left + width > window.innerWidth - 12) left = Math.max(12, window.innerWidth - 12 - width);
  const below = rect.bottom + 8;
  const flip = below + height > window.innerHeight - 12;
  preview.style.left = `${left}px`;
  preview.style.top = `${flip ? Math.max(12, rect.top - height - 8) : below}px`;
}

function PreviewChip({ to, children, detail, image }: { to: string; children: ReactNode; detail: string; image?: string }) {
  const chip = useRef<HTMLSpanElement>(null);
  const show = () => { if (chip.current) placePreview(chip.current); };
  return (
    <span ref={chip} className="about-chip" onMouseEnter={show} onFocus={show} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.classList.remove('is-open'); }}>
      <Link className="about-pill" to={to} onPointerDown={event => {
        if (event.pointerType !== 'touch' || chip.current?.classList.contains('is-open')) return;
        chip.current?.classList.add('is-open');
        chip.current?.setAttribute('data-hold', 'true');
        if (chip.current) placePreview(chip.current);
      }} onClick={event => {
        if (chip.current?.getAttribute('data-hold') !== 'true') return;
        chip.current.removeAttribute('data-hold');
        event.preventDefault();
      }}>{children}</Link>
      <span className="about-preview" aria-hidden="true">{image ? <img src={image} alt="" /> : null}<span>{detail}</span></span>
    </span>
  );
}

function WorkAreas() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const toggle = () => {
    const control = button.current;
    const paragraph = control?.closest('.about-display') as HTMLElement | null;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fromHeight = paragraph?.getBoundingClientRect().height ?? 0;
    setOpen(value => !value);
    if (reduce || !paragraph) return;
    requestAnimationFrame(() => {
      const toHeight = paragraph.getBoundingClientRect().height;
      if (Math.abs(toHeight - fromHeight) > 1) paragraph.animate([{ height: `${fromHeight}px` }, { height: `${toHeight}px` }], { duration: 280, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    });
  };
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  return <span className={`about-area${open ? ' is-open' : ''}`}>
    <button ref={button} type="button" className={`about-pill about-cycle${open ? ' is-open' : ''}`} aria-expanded={open} onClick={toggle}>
      {open ? <>
        <span className="about-cycle-phrase">AI, public policy, education, research, journalism, and </span>
        <span className="about-cycle-end"><span className="about-cycle-phrase">communications</span><span className="about-cycle-period">.</span></span>
      </> : <>
        <span className="about-cycle-value">AI</span>
        <span className="about-cycle-caret" aria-hidden="true">▾</span>
      </>}
    </button>
    {open ? null : '.'}
  </span>;
}

function DisplayParagraph() {
  const parts = PROFILE_SUMMARY.split(new RegExp(`(Seattle-based|${AREA_PHRASE}|Summation|enterprise,)`));
  return (
    <p className="about-display">
      {parts.map((part, index) => {
        if (part === 'Seattle-based') {
          return <PreviewChip key={index} to="/?album=washington-state" image={seattleCover} detail="Washington"><MapPin className="about-pill-mark" size={14} strokeWidth={1.75} aria-hidden="true" />{part}</PreviewChip>;
        }
        if (part.endsWith('across ') && parts[index + 1] === AREA_PHRASE) {
          return <span key={index}>{part.slice(0, -'across '.length)}across <span className="about-cycle-keep"><WorkAreas /></span> </span>;
        }
        if (part === AREA_PHRASE) return null;
        if (part.startsWith('. ')) return <span className="about-after" key={index}>{part.slice(2)}</span>;
        if (part === 'Summation') return <PreviewChip key={index} to="/work" detail={`${roleFor('summation-ai')?.role ?? 'Marketing and communications'} · ${roleFor('summation-ai')?.period ?? ''} · ${publishedCount} projects`}>{part}</PreviewChip>;
        if (part === 'enterprise,') {
          const role = roleFor('boehringer-cares-foundation-rebrand-strategy-shift');
          return (
            <span key={index} className="about-phrase"><PreviewChip to="/projects/boehringer-cares-foundation-rebrand-strategy-shift" image={projectImage('boehringer-cares-foundation-rebrand-strategy-shift')} detail={`${role?.organization ?? 'Boehringer Ingelheim'} · ${role?.period ?? ''}`}>enterprise</PreviewChip>,</span>
          );
        }
        return part;
      })}
    </p>
  );
}

export default function AboutPage() {
  const [sidebarOpen, setSidebarOpen] = useSidebarState();
  const [searchOpen, setSearchOpen] = useState(false);
  const mobile = useIsMobile();
  const navigationMotion = useNavigationMotion(sidebarOpen || searchOpen);
  const offset = !mobile && sidebarOpen;
  const toggleSidebar = () => { setSearchOpen(false); setSidebarOpen(open => !open); };
  const openSearch = () => { setSidebarOpen(false); setSearchOpen(true); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} onClose={() => setSidebarOpen(false)} onSearchOpen={openSearch} activeSection="about" showToggle={false} />
      <motion.main
        className="min-h-screen px-6 pb-24 pt-32 md:pt-40"
        animate={{ marginLeft: sidebarOpen && !mobile ? 200 : 0, marginRight: 0, width: offset ? 'calc(100% - 200px)' : '100%' }}
        transition={navigationMotion}
      >
        <article className="about-article mx-auto">
          <h1 className="mb-8 text-3xl font-medium tracking-tight">About</h1>
          <p id="about-cycle-hint" className="sr-only">Some phrases are links. The areas button expands to AI, public policy, education, research, journalism, and communications.</p>
          <DisplayParagraph />
          <div className="about-body">
            <p>Previously, Isaac helped build a <PreviewChip to="/projects/congressional-office-setup-100-day-report" detail={`${roleFor('congressional-office-setup-100-day-report')?.role ?? 'Communications'} · ${roleFor('congressional-office-setup-100-day-report')?.period ?? ''}`}>congressional office</PreviewChip> and managed communications for a Member of Congress, led AI literacy work with educators in <PreviewChip to="/projects/fulbright-focus-group-sponsored-by-openai" image={projectImage('fulbright-focus-group-sponsored-by-openai')} detail={`${roleFor('fulbright-focus-group-sponsored-by-openai')?.organization ?? 'Fulbright Taiwan'} · ${roleFor('fulbright-focus-group-sponsored-by-openai')?.period ?? ''}`}>Taiwan</PreviewChip> with support from OpenAI, and researched how AI and digital platforms affect <Link className="site-link" to="/projects/senior-thesis-local-journalism">journalism</Link>.</p>
            <p>He is a Fulbright and Truman Scholar and a member of OpenAI’s <Link className="site-link" to="/projects/openai-product-testing-and-feedback">ChatGPT Lab</Link>.</p>
          </div>
        </article>
      </motion.main>
      <SiteHeader open={sidebarOpen} onToggle={toggleSidebar} searchOpen={searchOpen} onSearchOpen={openSearch} onSearchClose={() => setSearchOpen(false)} />
    </div>
  );
}
