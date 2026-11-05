import { useSidebarState } from "@/lib/siteChrome";
import { useNavigationMotion } from "@/hooks/useMotionPreference";
import { useState } from 'react';
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
  const visual = active ? representativeProjectImage(active) : null;

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
                    >
                      <span className="work-index-title">{project.title}</span>
                      <span className="work-index-year">{project.year || '—'}</span>
                      <span className="work-index-who" title={who || undefined}>{who || '—'}</span>
                      <span className="work-index-type">{typeLabel[project.source]}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            {visual && active && (
              <figure className="work-preview work-story-image site-media" aria-hidden="true">
                <img src={visual.src} {...responsiveProjectImageProps(visual.src, '(max-width: 767px) calc(100vw - 48px), 60vw')} alt="" />
                <figcaption>{active.year} · {typeLabel[active.source]}</figcaption>
              </figure>
            )}
          </div>
          </div>
        </main>
      </motion.div>
      <SiteHeader open={sidebarOpen} onToggle={toggleSidebar} searchOpen={searchOpen} onSearchOpen={openSearch} onSearchClose={() => setSearchOpen(false)} />
    </div>
  );
}
