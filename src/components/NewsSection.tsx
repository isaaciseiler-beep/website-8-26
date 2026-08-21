import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { newsItems } from "@/lib/siteContent";

const NewsSection = () => (
  <section className="news-compact" aria-labelledby="news-compact-title">
    <h2 id="news-compact-title" className="sr-only">News</h2>

    <div className="work-library-grid">
      {newsItems.map((item, index) => (
        <motion.a
          key={item.id}
          href={item.href}
          target={item.href === "#" ? undefined : "_blank"}
          rel={item.href === "#" ? undefined : "noopener noreferrer"}
          className="work-library-card group"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.3, delay: Math.min(index * 0.025, 0.16) }}
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
    </div>
  </section>
);

export default NewsSection;
