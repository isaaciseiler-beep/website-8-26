import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { newsItems } from "@/lib/siteContent";

const INITIAL_COUNT = 6;

const NewsSection = () => {
  const [expanded, setExpanded] = useState(false);
  const collapsed = !expanded && newsItems.length > INITIAL_COUNT;
  const visible = collapsed ? newsItems.slice(0, INITIAL_COUNT) : newsItems;

  return (
    <section className="news-compact" aria-labelledby="news-compact-title">
      <h2 id="news-compact-title" className="sr-only">News</h2>

      <div className={`work-library-reveal ${collapsed ? "is-collapsed" : ""}`}>
        <motion.div layout className="work-library-grid">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((item, index) => (
              <motion.a
                key={item.id}
                layout
                href={item.href}
                target={item.href === "#" ? undefined : "_blank"}
                rel={item.href === "#" ? undefined : "noopener noreferrer"}
                className="work-library-card group"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1], delay: Math.min((index % INITIAL_COUNT) * 0.03, 0.15) }}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" loading="lazy" decoding="async" />
                ) : null}
                <div className="work-library-scrim" />
                <div className="news-compact-logo-row">
                  <img src={item.logoUrl} alt={item.logoAlt} className="news-compact-logo" loading="lazy" />
                </div>
                <div className="work-library-card-bottom">
                  <h3>{item.title}</h3>
                  <ArrowUpRight aria-hidden="true" />
                </div>
              </motion.a>
            ))}
          </AnimatePresence>
        </motion.div>
        {collapsed ? <div className="work-library-fade" aria-hidden="true" /> : null}
      </div>

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
