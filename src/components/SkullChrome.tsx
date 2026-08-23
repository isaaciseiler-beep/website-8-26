import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

/**
 * Period-correct hit counter. Only renders in skull mode.
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
    <div className="skull-counter" aria-hidden="true">
      <span className="skull-counter-label">You are visitor number</span>
      <span className="skull-counter-digits">
        {counter.map((digit, index) => (
          <b key={`${digit}-${index}`}>{digit}</b>
        ))}
      </span>
    </div>
  );
};

export default SkullChrome;
