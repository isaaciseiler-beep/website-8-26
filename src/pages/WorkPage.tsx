import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import SiteHeader from '@/components/SiteHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { hiddenProjectIds, orderProjectItemsForWork, projectItems, type ProjectItem } from '@/lib/siteContent';
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion';
import './work-page.css';

const projects = orderProjectItemsForWork(projectItems).filter(project => !hiddenProjectIds.has(project.id));
const rows = Array.from({ length: Math.ceil(projects.length / 2) }, (_, index) => projects.slice(index * 2, index * 2 + 2));

function WorkStory({ project, square, eager = false }: { project: ProjectItem; square: boolean; eager?: boolean }) {
  return (
    <article className={`work-story${square ? ' work-story--square' : ''}`}>
      <Link to={`/projects/${project.id}`} aria-labelledby={`work-title-${project.id}`}>
        <div className="work-story-image site-corner">
          <img src={project.image} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />
          <div className="work-story-caption">
            <h2 id={`work-title-${project.id}`}>{project.title}</h2>
            <p>{project.year}</p>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function WorkPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const toggleSidebar = () => { setSearchOpen(false); setSidebarOpen(open => !open); };
  const openSearch = () => { setSidebarOpen(false); setSearchOpen(true); };
  const offset = !isMobile && (sidebarOpen || searchOpen);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} onClose={() => setSidebarOpen(false)} onSearchOpen={openSearch} activeSection="projects" showToggle={false} />
      <motion.div
        animate={{ marginLeft: sidebarOpen && !isMobile ? 200 : 0, marginRight: searchOpen && !isMobile ? 200 : 0, width: offset ? 'calc(100% - 200px)' : '100%' }}
        transition={{ duration: reducedMotion ? 0 : MOTION_DURATION.reveal, ease: MOTION_EASE }}
      >
        <main className="work-page photos-shell" aria-label="Work">
          <div className="work-grid">
            {rows.map((row, rowIndex) => (
              <div className={`work-row${rowIndex % 2 ? ' work-row--reverse' : ''}`} key={row[0].id}>
                {row.map((project, columnIndex) => (
                  <WorkStory key={project.id} project={project} square={columnIndex === (rowIndex % 2 ? 0 : 1)} eager={rowIndex === 0} />
                ))}
              </div>
            ))}
          </div>
        </main>
      </motion.div>
      <SiteHeader open={sidebarOpen} onToggle={toggleSidebar} searchOpen={searchOpen} onSearchOpen={openSearch} onSearchClose={() => setSearchOpen(false)} />
    </div>
  );
}
