import { useSidebarState } from "@/lib/siteChrome";
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
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
  const [index, setIndex] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const move = (direction: number) => {
    restoreFocus.current = document.activeElement === buttonRef.current;
    const next = (index + AREAS.length + direction) % AREAS.length;
    setAnnouncement(AREAS[next]);
    setIndex(next);
  };
  useLayoutEffect(() => {
    if (!restoreFocus.current) return;
    restoreFocus.current = false;
    buttonRef.current?.focus();
  }, [index]);
  const words = AREAS.map((label, areaIndex) => {
    const lead = areaIndex === 0 ? '' : areaIndex === AREAS.length - 1 ? ' and ' : ' ';
    const text = areaIndex === AREAS.length - 1 ? `${label}.` : `${label},`;
    const word = areaIndex === index
      ? <button ref={buttonRef} type="button" className="about-pill about-cycle about-word" aria-label={`${label}. Show next`} onClick={event => { if (!event.shiftKey) move(1); }} onKeyDown={event => { if (event.shiftKey && event.key === 'Enter') { event.preventDefault(); move(-1); } }}>{text}</button>
      : <span className="about-word">{text}</span>;
    return <span key={label}>{lead}<span className="about-cycle-stack"><span className="about-cycle-sizer about-word" aria-hidden="true">{text}</span>{word}</span></span>;
  });
  return <><span className="sr-only" aria-live="polite">{announcement}</span>{words}</>;
}

function DisplayParagraph() {
  const parts = PROFILE_SUMMARY.split(new RegExp(`(Seattle-based|${AREA_PHRASE}|Summation|enterprise,)`));
  return (
    <p className="about-display">
      {parts.map((part, index) => {
        if (part === 'Seattle-based') {
          return <PreviewChip key={index} to="/?album=washington-state" image={seattleCover} detail="Washington"><MapPin className="about-pill-mark" size={14} strokeWidth={1.75} aria-hidden="true" />{part}</PreviewChip>;
        }
        if (part === AREA_PHRASE) return <WorkAreas key={index} />;
        if (part.startsWith('. ')) return <span className="about-after" key={index}>{part.slice(1)}</span>;
        if (part === 'Summation') return <PreviewChip key={index} to="/work" detail={`${roleFor('summation-ai')?.role ?? 'Marketing and communications'} · ${roleFor('summation-ai')?.period ?? ''} · ${publishedCount} projects`}>{part}</PreviewChip>;
        if (part === 'enterprise,') {
          const role = roleFor('boehringer-cares-foundation-rebrand-strategy-shift');
          return (
            <span key={index} className="about-phrase"><PreviewChip to="/projects/boehringer-cares-foundation-rebrand-strategy-shift" image={projectImage('boehringer-cares-foundation-rebrand-strategy-shift')} detail={`${role?.organization ?? 'Boehringer Ingelheim'} · ${role?.period ?? ''}`}>enterprise,</PreviewChip></span>
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
          <p id="about-cycle-hint" className="sr-only">Some phrases are links. The area of work button cycles on Enter or Space; Shift plus Enter goes back.</p>
          <DisplayParagraph />
          <div className="about-body space-y-6 text-lg leading-relaxed">
            <p>Previously, Isaac helped build a <PreviewChip to="/projects/congressional-office-setup-100-day-report" detail={`${roleFor('congressional-office-setup-100-day-report')?.role ?? 'Communications'} · ${roleFor('congressional-office-setup-100-day-report')?.period ?? ''}`}>congressional office</PreviewChip> and managed communications for a Member of Congress, led AI literacy work with educators in <PreviewChip to="/projects/fulbright-focus-group-sponsored-by-openai" image={projectImage('fulbright-focus-group-sponsored-by-openai')} detail={`${roleFor('fulbright-focus-group-sponsored-by-openai')?.organization ?? 'Fulbright Taiwan'} · ${roleFor('fulbright-focus-group-sponsored-by-openai')?.period ?? ''}`}>Taiwan</PreviewChip> with support from OpenAI, and researched how AI and digital platforms affect <Link className="site-link" to="/projects/senior-thesis-local-journalism">journalism</Link>.</p>
            <p>He is a Fulbright and Truman Scholar and a member of OpenAI’s <Link className="site-link" to="/projects/openai-product-testing-and-feedback">ChatGPT Lab</Link>.</p>
          </div>
        </article>
      </motion.main>
      <SiteHeader open={sidebarOpen} onToggle={toggleSidebar} searchOpen={searchOpen} onSearchOpen={openSearch} onSearchClose={() => setSearchOpen(false)} />
    </div>
  );
}
