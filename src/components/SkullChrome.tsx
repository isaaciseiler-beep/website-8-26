import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

/**
 * Extra period-correct dial-up chrome: a scrolling marquee bar, a
 * "best viewed in" strip and a hit counter. Only renders in skull mode.
 */
const SkullChrome = () => {
  const { theme } = useTheme();
  const [hits, setHits] = useState(0);

  useEffect(() => {
    if (theme !== "skull") return;
    const stored = Number(window.localStorage.getItem("skull-hits") || "8341") + 1;
    window.localStorage.setItem("skull-hits", String(stored));
    setHits(stored);
  }, [theme]);

  if (theme !== "skull") return null;

  const counter = String(hits).padStart(6, "0").split("");

  return (
    <>
      <div className="skull-marquee" aria-hidden="true">
        <div className="skull-marquee-track">
          <span>
            ★ WELCOME TO ISAAC SEILER'S HOMEPAGE ★ THIS SITE IS UNDER CONSTRUCTION ★ PLEASE SIGN MY
            GUESTBOOK ★ BEST VIEWED AT 800x600 ★ 56K MODEM RECOMMENDED ★
          </span>
          <span>
            ★ WELCOME TO ISAAC SEILER'S HOMEPAGE ★ THIS SITE IS UNDER CONSTRUCTION ★ PLEASE SIGN MY
            GUESTBOOK ★ BEST VIEWED AT 800x600 ★ 56K MODEM RECOMMENDED ★
          </span>
        </div>
      </div>

      <div className="skull-counter" aria-hidden="true">
        <span className="skull-counter-label">You are visitor number</span>
        <span className="skull-counter-digits">
          {counter.map((digit, index) => (
            <b key={`${digit}-${index}`}>{digit}</b>
          ))}
        </span>
      </div>
    </>
  );
};

export default SkullChrome;
