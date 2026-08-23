import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { musicAlbums } from "@/lib/musicAlbums";

const EASE_TEXT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const MusicPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
        transition={{ duration: 0.56, ease: EASE_TEXT }}
      >
        <main className="music-page-shell">
          <motion.h1
            className="music-page-title"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.55, ease: EASE_TEXT }}
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
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.5,
                  delay: prefersReducedMotion ? 0 : Math.min(index * 0.035, 0.3),
                  ease: EASE_TEXT,
                }}
              >
                <img
                  src={release.image}
                  alt=""
                  loading={index < 6 ? "eager" : "lazy"}
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
