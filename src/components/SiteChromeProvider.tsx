import { useMemo, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { SidebarStateContext, SiteChromeContext } from '@/lib/siteChrome';
import { SidebarSurface, type SidebarProps } from './Sidebar';
import { SiteHeaderSurface, type SiteHeaderProps } from './SiteHeader';

type Registration<T> = { props: T };

export default function SiteChromeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const sidebarState = useMemo<[boolean, Dispatch<SetStateAction<boolean>>]>(() => [open, setOpen], [open]);
  const [sidebar, setSidebar] = useState<Registration<SidebarProps> | null>(null);
  const [header, setHeader] = useState<Registration<SiteHeaderProps> | null>(null);
  const registry = useMemo(() => {
    const register = <T,>(set: Dispatch<SetStateAction<Registration<T> | null>>) => (props: T) => {
      const registration = { props };
      set(registration);
      return () => {
        // A destination registers in the same commit that the old page leaves.
        // Wait past the view-transition snapshot so this cleanup cannot drop the
        // chrome before that registration, or before the page-ready close.
        requestAnimationFrame(() => set(current => current === registration ? null : current));
      };
    };
    return { sidebar: register(setSidebar), header: register(setHeader) };
  }, []);

  return <SidebarStateContext.Provider value={sidebarState}><SiteChromeContext.Provider value={registry}>
    {children}
    {sidebar && <SidebarSurface {...sidebar.props} />}
    {header && <SiteHeaderSurface {...header.props} />}
  </SiteChromeContext.Provider></SidebarStateContext.Provider>;
}
