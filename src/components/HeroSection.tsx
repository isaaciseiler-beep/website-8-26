import { useMotionPreference as useReducedMotion } from "@/hooks/useMotionPreference";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { albums, coverFor } from "@/lib/photoAlbums";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const coverFrom = (folder: string) => {
  const album = albums.find((candidate) => candidate.folder === folder);
  return album ? coverFor(album) : "/project-images/aiindex.jpg";
};

const heroImages = [
  { src: coverFrom("Taiwan"), alt: "A photograph from Taiwan", className: "home-photo-mosaic-main" },
  { src: coverFrom("Iceland"), alt: "A photograph from Iceland", className: "home-photo-mosaic-small" },
  { src: coverFrom("Japan"), alt: "A photograph from Japan", className: "home-photo-mosaic-small" },
];

const HeroSection = () => {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? false : { opacity: 0, y: 12 };

  return (
    <section className="home-photo-hero" aria-labelledby="home-hero-title">
      <motion.div
        className="home-photo-hero-copy"
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.52, ease: EASE }}
      >
        <h1 id="home-hero-title">
          Bridging the gap between humans and AI.
        </h1>

        <div className="home-photo-hero-bottom">
          <p>
            Isaac Seiler is a researcher and communicator working across artificial intelligence,
            public institutions, education, and everyday life.
          </p>
          <div className="home-photo-hero-links">
            <a href="#projects">Selected work <ArrowDownRight aria-hidden="true" /></a>
            <Link to="/experience">Experience <ArrowUpRight aria-hidden="true" /></Link>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="home-photo-mosaic"
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.58, ease: EASE, delay: reduceMotion ? 0 : 0.08 }}
        aria-label="Selected photography"
      >
        {heroImages.map((image) => (
          <div key={image.src} className={`home-photo-mosaic-image ${image.className}`}>
            <img src={image.src} alt={image.alt} loading="eager" decoding="async" />
          </div>
        ))}
      </motion.div>
    </section>
  );
};

export default HeroSection;
