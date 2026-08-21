import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { newsItems } from "@/lib/siteContent";

const INITIAL_COUNT = 6;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const NewsSection = () => {
  const [expanded, setExpanded] = useState(false);
  const collapsed = !expanded && newsItems.length > INITIAL_COUNT;
  const visible = collapsed ? newsItems.slice(0, INITIAL_COUNT) : newsItems;

  return (
    <section className="news-compact" aria-labelledby="news-compact-title">
      <h2 id="news-compact-title" className="sr-only">News</h2>

      <motion.div layout transition={{ duration: 0.45, ease: EASE }} className="work-library-grid">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((item, index) => (
              <motion.a
                key={item.id}
                layout
                href={item.href}
                target={item.href === "#" ? undefined : "_blank"}
                rel={item.href === "#" ? undefined : "noopener noreferrer"}
                className="work-library-card group"
                initial={{ opacity: 0, scale: 0.985, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.985, filter: "blur(6px)" }}
                transition={{ duration: 0.5, ease: EASE, delay: Math.min((index % INITIAL_COUNT) * 0.035, 0.18) }}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" loading="lazy" decoding="async" />
                ) : null}
                <div className="work-library-scrim" />
                <div className="news-compact-logo-row">
                  <img src={item.logoUrl} alt={item.logoAlt} className="news-compact-logo" loading="lazy" />
                </div>
                <div className="work-library-card-bottom">
                  <ArrowRight aria-hidden="true" className="work-library-card-arrow" />
                  <h3>{item.title}</h3>
                </div>
              </motion.a>
            ))}
          </AnimatePresence>
      </motion.div>

      {newsItems.length > INITIAL_COUNT ? (
        <div className="work-library-more">
          <button
            type="button"
            className="pill-button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            <span>{expanded ? "View less" : "View more"}</span>
            <ChevronDown aria-hidden="true" className={expanded ? "is-flipped" : ""} />
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default NewsSection;
