import { useMemo, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { SiteChromeContext } from '@/lib/siteChrome';
import { SidebarSurface, type SidebarProps } from './Sidebar';
import { SiteHeaderSurface, type SiteHeaderProps } from './SiteHeader';

type Registration<T> = { props: T };

export default function SiteChromeProvider({ children }: { children: ReactNode }) {
  const [sidebar, setSidebar] = useState<Registration<SidebarProps> | null>(null);
  const [header, setHeader] = useState<Registration<SiteHeaderProps> | null>(null);
  const registry = useMemo(() => {
    const register = <T,>(set: Dispatch<SetStateAction<Registration<T> | null>>) => (props: T) => {
      const registration = { props };
      set(registration);
      return () => {
        // A destination registers in the same commit that the old page leaves.
        // Never remove its chrome while cleaning up the previous registration.
        queueMicrotask(() => set(current => current === registration ? null : current));
      };
    };
    return { sidebar: register(setSidebar), header: register(setHeader) };
  }, []);

  return <SiteChromeContext.Provider value={registry}>
    {children}
    {sidebar && <SidebarSurface {...sidebar.props} />}
    {header && <SiteHeaderSurface {...header.props} />}
  </SiteChromeContext.Provider>;
}
