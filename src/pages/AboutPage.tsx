import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import SiteHeader from '@/components/SiteHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigationMotion } from '@/hooks/useMotionPreference';
import { PROFILE_SUMMARY } from '@/lib/siteIdentity.mjs';

export default function AboutPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const mobile = useIsMobile();
  const navigationMotion = useNavigationMotion(sidebarOpen || searchOpen);
  const offset = !mobile && (sidebarOpen || searchOpen);
  const toggleSidebar = () => { setSearchOpen(false); setSidebarOpen(open => !open); };
  const openSearch = () => { setSidebarOpen(false); setSearchOpen(true); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} onClose={() => setSidebarOpen(false)} onSearchOpen={openSearch} activeSection="about" showToggle={false} />
      <motion.main
        className="min-h-screen px-6 pb-24 pt-32 md:pt-40"
        animate={{ marginLeft: sidebarOpen && !mobile ? 200 : 0, marginRight: searchOpen && !mobile ? 200 : 0, width: offset ? 'calc(100% - 200px)' : '100%' }}
        transition={navigationMotion}
      >
        <article className="mx-auto max-w-xl">
          <h1 className="mb-8 text-3xl font-medium tracking-tight">About</h1>
          <div className="space-y-6 text-lg leading-relaxed">
            <p>{PROFILE_SUMMARY}</p>
            <p>Previously, Isaac helped build a congressional office and managed communications for a Member of Congress, led AI literacy work with educators in Taiwan with support from OpenAI, and researched how AI and digital platforms affect journalism.</p>
            <p>He is a Fulbright and Truman Scholar and a member of OpenAI’s ChatGPT Lab.</p>
          </div>
        </article>
      </motion.main>
      <SiteHeader open={sidebarOpen} onToggle={toggleSidebar} searchOpen={searchOpen} onSearchOpen={openSearch} onSearchClose={() => setSearchOpen(false)} />
    </div>
  );
}
