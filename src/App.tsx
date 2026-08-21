import { Component, Suspense, lazy, useEffect, useState, type ComponentType, type ErrorInfo, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Index from "./pages/Index.tsx";
import { ThemeProvider } from "@/components/ThemeProvider";

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
const PhotoMapPage = lazyWithRetry(() => import("./pages/PhotoMapPage.tsx"), "photo-map");
const ProjectsPage = lazyWithRetry(() => import("./pages/ProjectsPage.tsx"), "projects");
const ProjectDetailPage = lazyWithRetry(() => import("./pages/ProjectDetailPage.tsx"), "project-detail");
const AIStateGovernmentIndexPage = lazyWithRetry(() => import("./pages/AIStateGovernmentIndexPage.tsx"), "ai-state-government-index");
const SeniorThesisLocalJournalismPage = lazyWithRetry(() => import("./pages/SeniorThesisLocalJournalismPage.tsx"), "senior-thesis-local-journalism");
const CredentialsPage = lazyWithRetry(() => import("./pages/CredentialsPage.tsx"), "credentials");
const ExperiencePage = lazyWithRetry(() => import("./pages/ExperiencePage.tsx"), "experience");
const ExperienceGamePage = lazyWithRetry(() => import("./pages/ExperienceGamePage.tsx"), "experience-game");
const FulbrightMapPage = lazyWithRetry(() => import("./pages/FulbrightMapPage.tsx"), "fulbright-map");
const StrikeTrackerPage = lazyWithRetry(() => import("./pages/StrikeTrackerPage.tsx"), "strike-tracker");
const NotFound = lazyWithRetry(() => import("./pages/NotFound.tsx"), "not-found");

const queryClient = new QueryClient();

const PAGE_TRANSITION_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

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
  const location = useLocation();

  if (location.pathname === "/fulbrightmap") {
    return (
      <main className="grid min-h-[100svh] place-items-center bg-neutral-950 p-5 text-center text-white">
        <div>
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-white/80 shadow-lg shadow-black/30" />
          <div className="mt-4 text-lg font-semibold">Preparing the map</div>
          <p className="mt-1 text-sm leading-5 text-white/65">Loading New Taipei and shared spots.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-[100svh] place-items-center bg-background p-5 text-center text-foreground">
      <div>
        <div className="mx-auto h-px w-24 overflow-hidden bg-foreground/10">
          <div className="h-full w-1/2 animate-pulse bg-foreground/60" />
        </div>
        <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/45">
          Loading page
        </div>
      </div>
    </main>
  );
};

const RouteRenderErrorFallback = ({ isMap }: { isMap: boolean }) => (
  <main className={`grid min-h-[100svh] place-items-center p-5 text-center ${isMap ? "bg-neutral-950 text-white" : "bg-background text-foreground"}`}>
    <section className={`max-w-md rounded-[1.25rem] border p-6 shadow-2xl ${isMap ? "border-white/15 bg-neutral-950/80" : "border-foreground/10 bg-background"}`}>
      <div className="text-lg font-semibold">{isMap ? "The map could not finish loading" : "This page could not finish loading"}</div>
      <p className={`mt-2 text-sm leading-6 ${isMap ? "text-white/65" : "text-foreground/60"}`}>
        Refresh the page once. If it still fails, a network request or browser feature may be blocked.
      </p>
      <button
        type="button"
        className={`mt-5 rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] ${isMap ? "bg-white text-neutral-950" : "bg-foreground text-background"}`}
        onClick={() => window.location.reload()}
      >
        Refresh
      </button>
    </section>
  </main>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={location.pathname}
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1 }}
        exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.24,
          ease: PAGE_TRANSITION_EASE,
        }}
      >
        <RouteErrorBoundary
          resetKey={location.pathname}
          fallback={<RouteRenderErrorFallback isMap={location.pathname === "/fulbrightmap" || location.pathname === "/photos/map"} />}
        >
          <Suspense fallback={<RouteFallback />}>
            <Routes location={location}>
              <Route path="/" element={<Index />} />
              <Route path="/photos" element={<PhotosPage />} />
              <Route path="/photos/map" element={<PhotoMapPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/artificial-intelligence-in-state-government-index" element={<AIStateGovernmentIndexPage />} />
              <Route path="/projects/senior-thesis-local-journalism" element={<SeniorThesisLocalJournalismPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/credentials" element={<CredentialsPage />} />
              <Route path="/experience" element={<ExperiencePage />} />
              <Route path="/experience/arcade" element={<ExperienceGamePage />} />
              <Route path="/fulbrightmap" element={<FulbrightMapPage />} />
              <Route path="/strike-tracker" element={<StrikeTrackerPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );
};

const ChatOrbGate = () => {
  const location = useLocation();

  if (location.pathname === "/experience/arcade" || location.pathname === "/strike-tracker") {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <ChatOrb />
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AnimatedRoutes />
        <ChatOrbGate />
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
