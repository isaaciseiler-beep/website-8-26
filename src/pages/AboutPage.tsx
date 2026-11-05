import { useSidebarState } from "@/lib/siteChrome";
import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './about-page.css';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import SiteHeader from '@/components/SiteHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigationMotion } from '@/hooks/useMotionPreference';
import { PROFILE_SUMMARY } from '@/lib/siteIdentity.mjs';
import { albums, coverFor } from '@/lib/photoAlbums';

const AREAS = ['AI', 'public policy', 'education', 'research', 'journalism', 'communications'] as const;
const AREA_PHRASE = 'AI, public policy, education, research, journalism, and communications';
const seattleCover = coverFor(albums.find(album => album.folder === 'washington-state')!);

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
    const trail = areaIndex === AREAS.length - 1 ? '' : ',';
    const word = areaIndex === index
      ? <button ref={buttonRef} type="button" className="about-pill about-cycle" aria-label={`${label}. Show next`} onClick={event => { if (!event.shiftKey) move(1); }} onKeyDown={event => { if (event.shiftKey && event.key === 'Enter') { event.preventDefault(); move(-1); } }}>{label}{trail}</button>
      : <>{label}{trail}</>;
    return <span className="about-phrase" key={label}>{lead}{word}</span>;
  });
  return <><span className="sr-only" aria-live="polite">{announcement}</span>{words}</>;
}

function DisplayParagraph() {
  const parts = PROFILE_SUMMARY.split(new RegExp(`(Seattle-based|${AREA_PHRASE}|Summation|enterprise,)`));
  return (
    <p className="about-display">
      {parts.map((part, index) => {
        if (part === 'Seattle-based') {
          return (
            <Link key={index} className="about-pill" to="/?album=washington-state"><img className="about-pill-thumb" src={seattleCover} alt="" />{part}</Link>
          );
        }
        if (part === AREA_PHRASE) return <WorkAreas key={index} />;
        if (part === 'Summation') return <Link key={index} className="about-pill" to="/work">{part}</Link>;
        if (part === 'enterprise,') {
          return (
            <span key={index} className="about-phrase"><Link className="about-pill" to="/projects/boehringer-cares-foundation-rebrand-strategy-shift">enterprise,</Link></span>
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
            <p>Previously, Isaac helped build a <Link to="/projects/congressional-office-setup-100-day-report">congressional office</Link> and managed communications for a Member of Congress, led AI literacy work with educators in <Link to="/projects/fulbright-focus-group-sponsored-by-openai">Taiwan</Link> with support from OpenAI, and researched how AI and digital platforms affect <Link to="/projects/senior-thesis-local-journalism">journalism</Link>.</p>
            <p>He is a Fulbright and Truman Scholar and a member of OpenAI’s <Link to="/projects/openai-product-testing-and-feedback">ChatGPT Lab</Link>.</p>
          </div>
        </article>
      </motion.main>
      <SiteHeader open={sidebarOpen} onToggle={toggleSidebar} searchOpen={searchOpen} onSearchOpen={openSearch} onSearchClose={() => setSearchOpen(false)} />
    </div>
  );
}
