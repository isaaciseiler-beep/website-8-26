import { createContext, useContext } from 'react';

export const RouteNavigationContext = createContext<{ key: string; restoring: boolean } | null>(null);
export const useRouteNavigation = () => useContext(RouteNavigationContext);
