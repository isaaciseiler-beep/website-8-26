import { useNavigationMotion } from "@/hooks/useMotionPreference";
import { useMotionPreference as useReducedMotion } from "@/hooks/useMotionPreference";
import { motion } from "framer-motion";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { musicAlbums } from "@/lib/musicAlbums";
import { MOTION_DURATION, MOTION_EASE, MOTION_EASE_ENTER } from "@/lib/motion";

const EASE_TEXT = MOTION_EASE;

const MusicPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigationMotion = useNavigationMotion(sidebarOpen || searchOpen);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();


  const handleSidebarToggle = () => {
    setSearchOpen(false);
    setSidebarOpen((open) => !open);
  };

  const handleSearchOpen = () => {
    setSidebarOpen(false);
    setSearchOpen(true);
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <Sidebar
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        onClose={() => setSidebarOpen(false)}
        onSearchOpen={handleSearchOpen}
        showToggle={false}
      />

      <motion.div
        animate={{
          marginLeft: sidebarOpen && !isMobile ? 200 : 0,
          marginRight: searchOpen && !isMobile ? 200 : 0,
          width:
            sidebarOpen && !isMobile
              ? "calc(100% - 200px)"
              : searchOpen && !isMobile
                ? "calc(100% - 200px)"
                : "100%",
        }}
        transition={navigationMotion}
      >
        <main className="music-page-shell photos-shell">
          <motion.h1
            className="music-page-title"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : MOTION_DURATION.reveal, ease: MOTION_EASE_ENTER }}
          >
            What I'm listening to
          </motion.h1>

          <div className="music-album-scatter">
            {musicAlbums.map((release, index) => (
              <motion.a
                key={`${release.artist}-${release.album}`}
                className="music-album-card site-corner"
                href={release.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Listen to ${release.album} by ${release.artist} on Spotify`}
                initial={false}
                animate={{ opacity: 1 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : MOTION_DURATION.base,
                  delay: prefersReducedMotion ? 0 : Math.min(index * 0.025, 0.16),
                  ease: EASE_TEXT,
                }}
              >
                <img
                  src={release.image}
                  alt=""
                  loading={index < 2 ? "eager" : "lazy"}
                  decoding="async"
                />
                <span className="music-album-overlay" aria-hidden="true">
                  <span className="music-album-name">{release.album}</span>
                  <span className="music-album-artist">{release.artist}</span>
                </span>
              </motion.a>
            ))}
          </div>
        </main>
      </motion.div>

      <SiteHeader
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        searchOpen={searchOpen}
        onSearchOpen={handleSearchOpen}
        onSearchClose={() => setSearchOpen(false)}
      />
    </div>
  );
};

export default MusicPage;
