import { createContext, useContext, useLayoutEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { SidebarProps } from '@/components/Sidebar';
import type { SiteHeaderProps } from '@/components/SiteHeader';

type ChromeRegistry = {
  sidebar: (props: SidebarProps) => () => void;
  header: (props: SiteHeaderProps) => () => void;
};

export const SiteChromeContext = createContext<ChromeRegistry | null>(null);
export const SidebarStateContext = createContext<[boolean, Dispatch<SetStateAction<boolean>>] | null>(null);

export function useSidebarState() {
  const shared = useContext(SidebarStateContext);
  const local = useState(false);
  return shared ?? local;
}

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
