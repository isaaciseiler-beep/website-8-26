import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import headshotUrl from "@/assets/headshot.jpg";
import { bioLines } from "@/lib/siteContent";

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
        <p className="about-lede-eyebrow">Isaac Seiler — Seattle, Washington</p>

        <h1 id="about-lede-title" className="about-lede-headline">
          Bridging the gap between humans and AI.
        </h1>

        <div className="about-lede-body">
          <div className="about-lede-photo">
            <img src={headshotUrl} alt="Isaac Seiler" loading="eager" decoding="async" />
          </div>

          <div className="about-lede-copy">
            <p className="about-lede-intro">
              I&apos;m a strategist leading marketing and communications at Summation, working across
              artificial intelligence, public institutions, education, and everyday life.
            </p>
            <div className="about-lede-bio">
              {bioLines.slice(1).map((line) => <p key={line}>{line}</p>)}
            </div>
            <div className="about-lede-links">
              <Link to="/experience" className="pill-button">
                <span>Experience</span> <ArrowUpRight aria-hidden="true" />
              </Link>
              <a href="/isaac-seiler-resume.pdf" className="pill-button">
                <span>Résumé</span> <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default AboutSection;
