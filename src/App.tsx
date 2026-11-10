import PageNotice from "@/components/PageNotice";
import { useMotionPreference as useReducedMotion } from "@/hooks/useMotionPreference";
import { Component, Suspense, lazy, type ComponentType, type ErrorInfo, useEffect, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Index from "./pages/Index.tsx";
import AdaptiveHome from "./components/canvas/AdaptiveHome";
import CanvasDocuments from "./components/canvas/CanvasDocuments";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import SkullChrome from "@/components/SkullChrome";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import RouteLoader from "@/components/RouteLoader";
import PageTransitions from "@/components/PageTransitions";
import SiteChromeProvider from "@/components/SiteChromeProvider";
import ImagePreloader from "@/components/ImagePreloader";
import SiteMetadata from "@/components/SiteMetadata";
import { warmRoute } from "@/lib/routePreload";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motion";

const isRecoverableChunkError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(message);
};

const lazyWithRetry = <T extends { default: ComponentType }>(
  factory: () => Promise<T>,
  key: string,
) =>
  lazy(async () => {
    try {
      return await factory();
    } catch (firstError) {
      await new Promise((resolve) => window.setTimeout(resolve, 350));

      try {
        return await factory();
      } catch (secondError) {
        if (typeof window !== "undefined" && isRecoverableChunkError(secondError)) {
          const reloadKey = `route-chunk-reload:${key}:${window.location.pathname}`;
          if (!window.sessionStorage.getItem(reloadKey)) {
            window.sessionStorage.setItem(reloadKey, "1");
            window.location.reload();
          }
        }

        throw secondError ?? firstError;
      }
    }
  });

const ChatOrb = lazyWithRetry(() => import("@/components/ChatOrb"), "chat-orb");
const PhotosPage = lazyWithRetry(() => import("./pages/PhotosPage.tsx"), "photos");
const WorkPage = lazyWithRetry(() => import("./pages/WorkPage.tsx"), "work");
const AboutPage = lazyWithRetry(() => import("./pages/AboutPage.tsx"), "about");
const WritingPage = lazyWithRetry(() => import("./pages/WritingPage.tsx"), "writing");
const MusicPage = lazyWithRetry(() => import("./pages/MusicPage.tsx"), "music");
const ProjectDetailPage = lazyWithRetry(() => import("./pages/ProjectDetailPage.tsx"), "project-detail");
const AIStateGovernmentIndexPage = lazyWithRetry(() => import("./pages/AIStateGovernmentIndexPage.tsx"), "ai-state-government-index");
const SeniorThesisLocalJournalismPage = lazyWithRetry(() => import("./pages/SeniorThesisLocalJournalismPage.tsx"), "senior-thesis-local-journalism");
const ExperienceGamePage = lazyWithRetry(() => import("./pages/ExperienceGamePage.tsx"), "experience-game");
const FulbrightMapPage = lazyWithRetry(() => import("./pages/FulbrightMapPage.tsx"), "fulbright-map");
const StrikeTrackerPage = lazyWithRetry(() => import("./pages/StrikeTrackerPage.tsx"), "strike-tracker");
const NotFound = lazyWithRetry(() => import("./pages/NotFound.tsx"), "not-found");

class RouteErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; resetKey: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Route render failed", error, errorInfo);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const RouteFallback = () => {
  return <RouteLoader />;
};


const RouteRenderErrorFallback = ({ isMap }: { isMap: boolean }) => (
  <PageNotice title={isMap ? "The map could not load" : "This page could not load"} href={isMap ? "/photos" : "/work"} action={isMap ? "Browse photographs" : "Explore the work"} onRetry={() => window.location.reload()}>
    Something interrupted loading. You can try again or continue exploring.
  </PageNotice>
);


const SkullRouteFrame = ({ children, path }: { children: ReactNode; path: string }) => (
  <main className="win-shell win-route-desktop">
    <section className="win-window win-route-window" aria-label="Program window">
      <div className="win-titlebar">
        <span className="win-titlebar-icon" aria-hidden="true">▣</span>
        <h1>{path.replace(/^\//, "") || "home"} - Isaac Seiler</h1>
        <span className="win-titlebar-controls" aria-hidden="true"><i>_</i><i>□</i><i>×</i></span>
      </div>
      <div className="win-menubar" aria-hidden="true">
        <span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>H</u>elp</span>
      </div>
      <div className="win-addressbar">
        <span>Address</span><div>{`C:\\ISAAC${path.replaceAll("/", "\\").toUpperCase()}`}</div>
      </div>
      <div className="win-route-content">{children}</div>
      <div className="win-statusbar"><span>Ready</span><span>My Computer</span></div>
    </section>
  </main>
);

const Home = () => {
  const { theme } = useTheme();
  return theme === "skull" ? <Index /> : <AdaptiveHome />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const isSkullHome = location.pathname === "/" || location.pathname === "/about" || location.pathname === "/work";

  const renderRoutes = (presented: typeof location) => (
    <RouteErrorBoundary
      resetKey={presented.pathname}
      fallback={<RouteRenderErrorFallback isMap={presented.pathname === "/fulbrightmap"} />}
    >
        <Routes location={presented}>
          <Route path="/" element={<Home />} />
          <Route path="/classic" element={<Index />} />
          <Route path="/agents" element={<CanvasDocuments kind="agents" />} />
          <Route path="/projects/adaptive-portfolio" element={<CanvasDocuments kind="build" />} />
          <Route path="/photos" element={<PhotosPage />} />
          <Route path="/photos/locations" element={<Navigate to={{ pathname: "/photos", search: location.search }} replace />} />
          <Route path="/photos/map" element={<Navigate to="/photos#photo-globe" replace />} />
          <Route path="/photos/music" element={<MusicPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/work" element={<WorkPage />} />
          <Route path="/writing" element={<WritingPage />} />
          <Route path="/writing/:slug" element={<Navigate to="/writing" replace />} />
          <Route path="/projects" element={<Navigate to="/work" replace />} />
          <Route path="/projects/artificial-intelligence-in-state-government-index" element={<AIStateGovernmentIndexPage />} />
          <Route path="/projects/senior-thesis-local-journalism" element={<SeniorThesisLocalJournalismPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/credentials" element={<Navigate to="/about" replace />} />
          <Route path="/experience" element={<Navigate to="/about" replace />} />
          <Route path="/latest" element={<Navigate to="/work" replace />} />
          <Route path="/latest/:slug" element={<Navigate to="/work" replace />} />
          <Route path="/experience/arcade" element={<ExperienceGamePage />} />
          <Route path="/fulbrightmap" element={<FulbrightMapPage />} />
          <Route path="/strike-tracker" element={<StrikeTrackerPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
    </RouteErrorBoundary>
  );

  return <PageTransitions>{presented => theme === "skull" && !isSkullHome
    ? <SkullRouteFrame path={presented.pathname}>{renderRoutes(presented)}</SkullRouteFrame>
    : renderRoutes(presented)}</PageTransitions>;
};

const RouteFontAssets = () => {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname !== '/classic') return;
    const sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap';
    document.head.appendChild(sheet);
    return () => sheet.remove();
  }, [location.pathname]);
  return null;
};

const ChatOrbGate = () => {
  const location = useLocation();
  const { theme } = useTheme();

  if (location.pathname !== "/classic" || theme === "skull") {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <ChatOrb />
    </Suspense>
  );
};

const AppShell = () => {
  useScrollReveal();
  useEffect(() => {
    const warm = (event: Event) => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') as HTMLAnchorElement | null : null;
      if (anchor?.origin === window.location.origin) warmRoute(anchor.pathname);
    };
    document.addEventListener('pointerover', warm, { passive: true });
    document.addEventListener('focusin', warm);
    return () => { document.removeEventListener('pointerover', warm); document.removeEventListener('focusin', warm); };
  }, []);
  return (
    <BrowserRouter>
      <SiteMetadata />
      <RouteFontAssets />
      <ImagePreloader />
      <SkullChrome />
      <SiteChromeProvider><AnimatedRoutes /></SiteChromeProvider>
      <ChatOrbGate />
    </BrowserRouter>
  );
};

const App = () => {
  const reduced = useReducedMotion();
  return (
  <MotionConfig
    reducedMotion={reduced ? "always" : "never"}
    transition={{ type: "tween", duration: MOTION_DURATION.base, ease: MOTION_EASE }}
  >
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  </MotionConfig>
);
};

export default App;
