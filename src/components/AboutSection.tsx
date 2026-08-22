import { motion, useReducedMotion } from "framer-motion";
import headshotUrl from "@/assets/headshot.jpg";

interface AboutSectionProps {
  revealEnabled?: boolean;
}

const AboutSection = ({ revealEnabled = true }: AboutSectionProps) => {
  const reduceMotion = useReducedMotion();

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
          <div className="about-lede-photo">
            <img src={headshotUrl} alt="Isaac Seiler" loading="eager" decoding="async" />
          </div>

          <div className="about-lede-copy">
            <p className="about-lede-intro">
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

