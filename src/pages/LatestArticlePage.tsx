import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Footer from "@/components/Footer";
import PageSeo from "@/components/PageSeo";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { latestItemBySlug } from "@/lib/latestContent";

const LatestArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const item = latestItemBySlug(slug);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => { window.scrollTo({ top: 0 }); }, [slug]);

  if (!item) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
        <div>
          <h1 className="text-3xl font-medium">Note not found</h1>
          <Link to="/latest" className="mt-5 inline-flex items-center gap-2 text-sm">Latest notes <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </main>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <PageSeo
        title={`${item.title} | Isaac Seiler`}
        description={item.excerpt}
        path={`/latest/${item.slug}`}
        image={item.image}
        type="article"
        published={item.published}
        updated={item.updated}
      />
      <Sidebar
        open={sidebarOpen}
        onToggle={() => { setSearchOpen(false); setSidebarOpen((open) => !open); }}
        onClose={() => setSidebarOpen(false)}
        onSearchOpen={() => { setSidebarOpen(false); setSearchOpen(true); }}
        showToggle={false}
      />

      <motion.div
        animate={{
          marginLeft: sidebarOpen && !isMobile ? 200 : 0,
          marginRight: searchOpen && !isMobile ? 200 : 0,
          width: sidebarOpen && !isMobile || searchOpen && !isMobile ? "calc(100% - 200px)" : "100%",
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <article className="latest-article-shell">
          <Link to="/latest" className="latest-article-back"><ArrowLeft aria-hidden="true" /> Latest</Link>
          <header className="latest-article-header">
            <div className="latest-article-kicker">
              <span>{item.category}</span>
              <time dateTime={item.published}>{item.displayDate}</time>
              <span>{item.readingTime}</span>
            </div>
            <h1>{item.title}</h1>
            <p>{item.excerpt}</p>
          </header>

          <figure className="latest-article-hero">
            <img src={item.image} alt={item.imageAlt} loading="eager" decoding="async" fetchPriority="high" />
          </figure>

          <div className="latest-article-layout">
            <aside>
              <p>Topics</p>
              <ul>{item.about.map((topic) => <li key={topic}>{topic}</li>)}</ul>
            </aside>
            <div className="latest-article-body">
              {item.sections.map((section) => (
                <section key={section.heading}>
                  <h2>{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
                  {section.links ? (
                    <div className="latest-article-links">
                      {section.links.map((link) => {
                        const external = link.href.startsWith("http");
                        return external ? (
                          <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}<ArrowUpRight aria-hidden="true" /></a>
                        ) : (
                          <Link key={link.href} to={link.href}>{link.label}<ArrowUpRight aria-hidden="true" /></Link>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          </div>
        </article>
        <Footer />
      </motion.div>

      <SiteHeader
        open={sidebarOpen}
        onToggle={() => { setSearchOpen(false); setSidebarOpen((open) => !open); }}
        searchOpen={searchOpen}
        onSearchOpen={() => { setSidebarOpen(false); setSearchOpen(true); }}
        onSearchClose={() => setSearchOpen(false)}
      />
    </div>
  );
};

export default LatestArticlePage;
