import { createContext, useContext, useLayoutEffect } from 'react';
import type { SidebarProps } from '@/components/Sidebar';
import type { SiteHeaderProps } from '@/components/SiteHeader';

type ChromeRegistry = {
  sidebar: (props: SidebarProps) => () => void;
  header: (props: SiteHeaderProps) => () => void;
};

export const SiteChromeContext = createContext<ChromeRegistry | null>(null);

/** Pages supply their controls; the actual navigation survives route changes. */
export function useSiteChrome<K extends keyof ChromeRegistry>(kind: K, props: Parameters<ChromeRegistry[K]>[0]) {
  const registry = useContext(SiteChromeContext);
  useLayoutEffect(() => {
    if (!registry) return;
    // Each key has its own prop type; the generic keeps call sites checked.
    return (registry[kind] as (value: typeof props) => () => void)(props);
  }, [registry, kind, props]);
  return registry !== null;
}
