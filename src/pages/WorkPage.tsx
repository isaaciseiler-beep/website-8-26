import { useSidebarState } from "@/lib/siteChrome";
import { useNavigationMotion } from "@/hooks/useMotionPreference";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import SiteHeader from '@/components/SiteHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { hiddenProjectIds, orderProjectItemsForWork, projectItems, type ProjectItem } from '@/lib/siteContent';
import { experienceEntries } from '@/lib/experience';
import './work-page.css';
import { representativeProjectImage } from '@/components/canvas/projectVisual';
import { responsiveProjectImageProps } from '@/lib/responsiveProjectImages';

const projects = orderProjectItemsForWork(projectItems).filter(project => !hiddenProjectIds.has(project.id));

function markWorkHero(event: { currentTarget: HTMLAnchorElement }) {
  document.querySelectorAll<HTMLElement>('[data-work-hero]').forEach(node => {
    node.style.viewTransitionName = '';
    delete node.dataset.workHero;
  });
  const thumb = event.currentTarget.querySelector<HTMLElement>('.work-index-thumb');
  const rowImage = thumb?.querySelector('img');
  const thumbVisible = Boolean(thumb && getComputedStyle(thumb).display !== 'none');
  const preview = document.querySelector<HTMLImageElement>('.work-preview img');
  if (!thumbVisible && preview && rowImage) preview.src = rowImage.currentSrc || rowImage.src;
  const source = thumbVisible ? rowImage ?? thumb : preview;
  if (source instanceof HTMLElement) {
    source.dataset.workHero = 'true';
    source.style.viewTransitionName = 'work-hero';
  }
}
const typeLabel: Record<ProjectItem['source'], string> = {
  RESEARCH: 'Research',
  WORK: 'Work',
  REPORTING: 'Reporting',
  PROJECT: 'Project',
  BLOG: 'Writing',
};

function metaFor(id: string) {
  return experienceEntries.find(entry => entry.projectIds.includes(id));
}

function preloadCover(project: ProjectItem) {
  const image = new Image();
  image.src = representativeProjectImage(project).src;
}

function WorkPreview({ project }: { project: ProjectItem }) {
  const src = representativeProjectImage(project).src;
  const [current, setCurrent] = useState(src);
  const [previous, setPrevious] = useState<string | null>(null);
  useEffect(() => {
    const index = projects.findIndex(item => item.id === project.id);
    [index - 1, index, index + 1].forEach(item => { if (projects[item]) preloadCover(projects[item]); });
  }, [project.id]);
  useEffect(() => {
    if (src === current) return;
    let cancel = false;
    const incoming = new Image();
    incoming.src = src;
    const reveal = () => { if (!cancel) { setPrevious(current); setCurrent(src); } };
    if (incoming.complete && incoming.naturalWidth > 0) reveal();
    else { incoming.onload = reveal; incoming.onerror = reveal; }
    return () => { cancel = true; };
  }, [src, current]);
  return (
    <figure className={`work-preview work-story-image site-media${previous ? ' has-swap' : ''}`} aria-hidden="true">
      {previous && previous !== current ? <img className="is-previous" src={previous} alt="" /> : null}
      <img className="is-current" src={current} {...responsiveProjectImageProps(current, '(max-width: 767px) calc(100vw - 48px), 60vw')} alt="" />
      <figcaption>{project.year} · {typeLabel[project.source]}</figcaption>
    </figure>
  );
}

export default function WorkPage() {
  const [sidebarOpen, setSidebarOpen] = useSidebarState();
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeId, setActiveId] = useState(projects[0]?.id ?? '');
  const navigationMotion = useNavigationMotion(sidebarOpen || searchOpen);
  const isMobile = useIsMobile();
  const toggleSidebar = () => { setSearchOpen(false); setSidebarOpen(open => !open); };
  const openSearch = () => { setSidebarOpen(false); setSearchOpen(true); };
  const offset = !isMobile && sidebarOpen;
  const active = projects.find(project => project.id === activeId) ?? projects[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} onClose={() => setSidebarOpen(false)} onSearchOpen={openSearch} activeSection="projects" showToggle={false} />
      <motion.div
        animate={{ marginLeft: sidebarOpen && !isMobile ? 200 : 0, marginRight: 0, width: offset ? 'calc(100% - 200px)' : '100%' }}
        transition={navigationMotion}
      >
        <main className="work-page photos-shell" aria-label="Work">
          <div className="work-frame">
          <h1 className="sr-only">Work</h1>
          <p className="work-kicker site-meta"><span>Index</span><span>{projects.length}</span></p>
          <div className="work-layout">
            <ol className="work-index">
              {projects.map(project => {
                const meta = metaFor(project.id);
                const who = [meta?.role, meta?.organization].filter(Boolean).join(' · ');
                return (
                  <li key={project.id}>
                    <Link
                      state={{ fromWork: true }}
                      to={`/projects/${project.id}`}
                      aria-current={project.id === active?.id ? 'true' : undefined}
                      onMouseEnter={() => setActiveId(project.id)}
                      onFocus={() => setActiveId(project.id)}
                      onClick={markWorkHero}
                    >
                      <span className="work-index-thumb" aria-hidden="true"><img src={representativeProjectImage(project).src} alt="" /></span>
                      <span className="work-index-copy">
                        <span className="work-index-title">{project.title}</span>
                        <span className="work-index-meta">
                          <span className="work-index-year">{project.year || '—'}</span>
                          <span className="work-index-who" title={who || undefined}>{who || '—'}</span>
                          <span className="work-index-type">{typeLabel[project.source]}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            {active && <WorkPreview project={active} />}
          </div>
          </div>
        </main>
      </motion.div>
      <SiteHeader open={sidebarOpen} onToggle={toggleSidebar} searchOpen={searchOpen} onSearchOpen={openSearch} onSearchClose={() => setSearchOpen(false)} />
    </div>
  );
}
