import { useEffect, useState } from "react";

const ReadingProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <>
      <div className="reading-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
      <div
        className="reading-progress-readout"
        data-visible={progress > 1 ? "true" : "false"}
        aria-hidden="true"
      >
        <span className="reading-progress-track">
          <span style={{ transform: `scaleX(${progress / 100})` }} />
        </span>
        <span className="reading-progress-value">{Math.round(progress)}% read</span>
      </div>
    </>
  );
};

export default ReadingProgress;
