import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";

const formatTime = (date: Date) => date.toLocaleTimeString([], {
  hour: "numeric",
  minute: "2-digit",
});

type BootStage = "bios" | "windows" | "settings";

const SkullBootSequence = ({ stage, onSkip }: { stage: BootStage; onSkip: () => void }) => (
  <div
    className={`win-boot win-boot--${stage}`}
    role="dialog"
    aria-modal="true"
    aria-label="Starting Windows 95 mode"
  >
    {stage === "bios" ? (
      <div className="win-boot-bios" aria-live="polite">
        <p>PhoenixBIOS 4.0 Release 6.0</p>
        <p>Copyright 1985-1995 Phoenix Technologies Ltd.</p>
        <br />
        <p>ISAAC-SEILER PERSONAL COMPUTER</p>
        <p>CPU: 80486DX2 at 66 MHz</p>
        <p>Memory Test: 16384K OK</p>
        <p>Detecting IDE Primary Master ... PORTFOLIO HDD</p>
        <p>Detecting Mouse ............... Found</p>
        <br />
        <p className="win-boot-bios-last">Starting MS-DOS...</p>
      </div>
    ) : null}

    {stage === "windows" ? (
      <div className="win-boot-splash" aria-live="polite">
        <div className="win-boot-flag" aria-hidden="true">
          <i /><i /><i /><i />
        </div>
        <div>
          <span>Microsoft</span>
          <strong>Windows<span>95</span></strong>
        </div>
        <p>Getting ready to run Windows for the first time...</p>
      </div>
    ) : null}

    {stage === "settings" ? (
      <div className="win-boot-settings" aria-live="polite">
        <div className="win-boot-dialog">
          <div className="win-titlebar">
            <span className="win-titlebar-icon" aria-hidden="true">▦</span>
            <h2>Microsoft Windows</h2>
          </div>
          <div className="win-boot-dialog-body">
            <span className="win-boot-hourglass" aria-hidden="true">⌛</span>
            <div>
              <p>Please wait while Windows loads your personal settings...</p>
              <div className="win-boot-progress" aria-hidden="true"><i /></div>
            </div>
          </div>
        </div>
      </div>
    ) : null}

    <button type="button" className="win-boot-skip" onClick={onSkip}>Skip startup</button>
  </div>
);

const SkullChrome = () => {
  const { theme, exitSkullMode } = useTheme();
  const location = useLocation();
  const [hits, setHits] = useState(0);
  const [startOpen, setStartOpen] = useState(false);
  const [clock, setClock] = useState(() => formatTime(new Date()));
  const [bootStage, setBootStage] = useState<BootStage | null>(
    () => theme === "skull" ? "bios" : null,
  );
  const bootTimersRef = useRef<number[]>([]);

  const finishBoot = useCallback(() => {
    bootTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    bootTimersRef.current = [];
    setBootStage(null);
  }, []);

  useLayoutEffect(() => {
    finishBoot();
    if (theme !== "skull") {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setBootStage("bios");
    const windowsTimer = window.setTimeout(() => setBootStage("windows"), reduceMotion ? 180 : 850);
    const settingsTimer = window.setTimeout(() => setBootStage("settings"), reduceMotion ? 420 : 2200);
    const finishTimer = window.setTimeout(finishBoot, reduceMotion ? 750 : 3400);
    bootTimersRef.current = [windowsTimer, settingsTimer, finishTimer];

    return finishBoot;
  }, [finishBoot, theme]);

  useEffect(() => {
    if (!bootStage) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const skipOnKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        finishBoot();
      }
    };
    window.addEventListener("keydown", skipOnKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", skipOnKey);
    };
  }, [bootStage, finishBoot]);

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
      {bootStage ? <SkullBootSequence stage={bootStage} onSkip={finishBoot} /> : null}

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
