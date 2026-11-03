import { useSidebarState } from "@/lib/siteChrome";
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import SiteHeader from './SiteHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigationMotion } from '@/hooks/useMotionPreference';

export default function PageNotice({ title, children, href = '/', action = 'Return home', onRetry }: {
  title: string; children: ReactNode; href?: string; action?: string; onRetry?: () => void;
}) {
  const [menu, setMenu] = useSidebarState();
  const [search, setSearch] = useState(false);
  const mobile = useIsMobile();
  const transition = useNavigationMotion(menu || search);
  const toggleMenu = () => { setSearch(false); setMenu(value => !value); };
  const openSearch = () => { setMenu(false); setSearch(true); };
  return <div className="min-h-screen bg-background text-foreground">
    <Sidebar open={menu} onToggle={toggleMenu} onClose={() => setMenu(false)} onSearchOpen={openSearch} showToggle={false} />
    <motion.main className="site-notice" animate={{ marginLeft: menu && !mobile ? 200 : 0, marginRight: search && !mobile ? 200 : 0, width: !mobile && (menu || search) ? 'calc(100% - 200px)' : '100%' }} transition={transition}>
      <section><h1>{title}</h1><p>{children}</p><div className="site-notice-actions"><Link to={href}>{action}</Link>{onRetry && <button onClick={onRetry}>Try again</button>}</div></section>
    </motion.main>
    <SiteHeader open={menu} onToggle={toggleMenu} searchOpen={search} onSearchOpen={openSearch} onSearchClose={() => setSearch(false)} />
  </div>;
}
