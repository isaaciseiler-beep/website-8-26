import { useSidebarState } from "@/lib/siteChrome";
import { useNavigationMotion } from "@/hooks/useMotionPreference";
import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import SiteHeader from '@/components/SiteHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import './writing-page.css';

export default function WritingPage() {
  const [sidebarOpen, setSidebarOpen] = useSidebarState();
  const [searchOpen, setSearchOpen] = useState(false);
  const navigationMotion = useNavigationMotion(sidebarOpen || searchOpen);
  const mobile = useIsMobile();
  const offset = !mobile && sidebarOpen;
  const toggleSidebar = () => { setSearchOpen(false); setSidebarOpen(open => !open); };
  const openSearch = () => { setSidebarOpen(false); setSearchOpen(true); };
  return <div className="min-h-screen bg-background text-foreground">
    <Sidebar open={sidebarOpen} onToggle={toggleSidebar} onClose={() => setSidebarOpen(false)} onSearchOpen={openSearch} activeSection="writing" showToggle={false} />
    <motion.main className="writing-shell" animate={{ marginLeft: sidebarOpen && !mobile ? 200 : 0, marginRight: 0, width: offset ? 'calc(100% - 200px)' : '100%' }} transition={navigationMotion}>
      <h1 className="writing-title">Writing</h1>
      <p className="writing-coming-soon">Coming soon</p>
    </motion.main>
    <SiteHeader open={sidebarOpen} onToggle={toggleSidebar} searchOpen={searchOpen} onSearchOpen={openSearch} onSearchClose={() => setSearchOpen(false)} />
  </div>;
}
