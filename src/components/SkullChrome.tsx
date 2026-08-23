import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";

const formatTime = (date: Date) => date.toLocaleTimeString([], {
  hour: "numeric",
  minute: "2-digit",
});

const SkullChrome = () => {
  const { theme, exitSkullMode } = useTheme();
  const location = useLocation();
  const [hits, setHits] = useState(0);
  const [startOpen, setStartOpen] = useState(false);
  const [clock, setClock] = useState(() => formatTime(new Date()));

  useEffect(() => {
    if (theme !== "skull") return;
    const stored = Number(window.localStorage.getItem("skull-hits") || "8341") + 1;
    window.localStorage.setItem("skull-hits", String(stored));
    setHits(stored);
  }, [theme]);

  useEffect(() => {
    if (theme !== "skull") return;
    const updateClock = () => setClock(formatTime(new Date()));
    updateClock();
    const timer = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(timer);
  }, [theme]);

  useEffect(() => {
    setStartOpen(false);
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (!startOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setStartOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [startOpen]);

  if (theme !== "skull") return null;

  return (
    <div className="win-shell win-system-chrome">
      {startOpen ? (
        <div id="win-start-menu" className="win-start-menu">
          <div className="win-start-rail" aria-hidden="true">WINDOWS 95</div>
          <nav aria-label="Start menu">
            <Link to="/#skull-top"><span aria-hidden="true">▥</span><b>Home</b></Link>
            <Link to="/#skull-about"><span aria-hidden="true">▤</span><b>About</b></Link>
            <Link to="/#skull-work"><span aria-hidden="true">▦</span><b>Work</b></Link>
            <Link to="/#skull-photos"><span aria-hidden="true">▧</span><b>Photos</b></Link>
            <Link to="/#skull-contact"><span aria-hidden="true">✉</span><b>Contact</b></Link>
            <div className="win-start-separator" />
            <button type="button" onClick={exitSkullMode}><span aria-hidden="true">↪</span><b>Exit Skull Mode...</b></button>
            <div className="win-start-visitor">Visitor {String(hits).padStart(6, "0")}</div>
          </nav>
        </div>
      ) : null}

      <div className="win-taskbar">
        <button
          type="button"
          className={`win-start-button${startOpen ? " is-open" : ""}`}
          aria-expanded={startOpen}
          aria-controls="win-start-menu"
          onClick={() => setStartOpen((open) => !open)}
        >
          <span aria-hidden="true" className="win-start-logo">▦</span>
          Start
        </button>
        <button type="button" className="win-task-button" onClick={() => window.scrollTo({ top: 0 })}>
          <span aria-hidden="true">e</span>
          <span>Isaac Seiler — Internet Explorer</span>
        </button>
        <div className="win-task-tray" aria-label={`Current time ${clock}`}>
          <span aria-hidden="true">▣</span>
          <time>{clock}</time>
        </div>
      </div>
    </div>
  );
};

export default SkullChrome;
