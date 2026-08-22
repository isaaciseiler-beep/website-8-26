import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { profilePhotoUrl } from "@/lib/tileImages";

interface AboutSectionProps {
  revealEnabled?: boolean;
}

const AboutSection = ({ revealEnabled = true }: AboutSectionProps) => {
  const reduceMotion = useReducedMotion();
  const photoRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLParagraphElement>(null);
  const [fontSize, setFontSize] = useState<string>("");
  const fittingRef = useRef(false);

  useLayoutEffect(() => {
    const photo = photoRef.current;
    const intro = introRef.current;
    if (!photo || !intro) return;

    const fitText = () => {
      if (fittingRef.current) return;
      fittingRef.current = true;

      const targetHeight = photo.clientHeight * 0.5;
      const introWidth = intro.parentElement?.clientWidth ?? intro.clientWidth;
      if (!targetHeight || !introWidth) {
        fittingRef.current = false;
        return;
      }

      // Temporarily clear inline font size for a clean measurement pass
      intro.style.fontSize = "";
      const baseStyle = window.getComputedStyle(intro);
      const baseSize = parseFloat(baseStyle.fontSize) || 16;
      const baseHeight = intro.getBoundingClientRect().height;
      console.log("fitText", { targetHeight, baseHeight, baseSize, introWidth });

      let bestSize = baseSize;
      let low = 10;
      let high = Math.max(180, (targetHeight / Math.max(baseHeight, 1)) * baseSize * 1.6);

      for (let i = 0; i < 16; i++) {
        const mid = (low + high) / 2;
        intro.style.fontSize = `${mid}px`;
        const height = intro.getBoundingClientRect().height;
        if (height <= targetHeight) {
          bestSize = mid;
          low = mid;
        } else {
          high = mid;
        }
      }

      intro.style.fontSize = "";
      console.log("fitText result", { bestSize });
      setFontSize(`${bestSize}px`);
      fittingRef.current = false;
    };

    const ro = new ResizeObserver(fitText);
    ro.observe(photo);

    const timer = window.setTimeout(fitText, 0);
    const fontsPromise = document.fonts.ready.then(fitText);

    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <section className="about-lede" aria-labelledby="about-lede-title">
      <motion.div
        className="about-lede-inner"
        initial={reduceMotion || !revealEnabled ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 id="about-lede-title" className="sr-only">Isaac Seiler</h1>

        <div className="about-lede-body">
          <div ref={photoRef} className="about-lede-photo">
            <img src={profilePhotoUrl} alt="Isaac Seiler" loading="eager" decoding="async" />
          </div>

          <div className="about-lede-copy">
            <p
              ref={introRef}
              className="about-lede-intro"
              style={fontSize ? { fontSize } : undefined}
            >
              I&apos;m a strategist leading marketing and communications at Summation, working across
              artificial intelligence, public institutions, education, and everyday life.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default AboutSection;
