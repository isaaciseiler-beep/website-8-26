import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { latestItems } from "@/lib/latestContent";

const LatestSection = () => (
  <section className="latest-compact" aria-labelledby="latest-compact-title">
    <div className="latest-compact-heading">
      <h2 id="latest-compact-title">Latest</h2>
      <Link to="/latest" className="latest-compact-all-link">
        View all <ArrowUpRight aria-hidden="true" />
      </Link>
    </div>

    <div className="latest-compact-grid">
      {latestItems.slice(0, 3).map((item, index) => (
        <Link key={item.slug} to={`/latest/${item.slug}`} className="latest-compact-card group">
          <div className="latest-compact-image-wrap">
            <img
              src={item.image}
              alt={item.imageAlt}
              className="latest-compact-image"
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
          <div className="latest-compact-meta">
            <span>{item.category}</span>
            <time dateTime={item.published}>{item.displayDate}</time>
          </div>
          <div className="latest-compact-title-row">
            <h3>{item.title}</h3>
            <ArrowUpRight aria-hidden="true" />
          </div>
          <p>{item.excerpt}</p>
        </Link>
      ))}
    </div>
  </section>
);

export default LatestSection;
