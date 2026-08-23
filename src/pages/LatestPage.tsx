import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import PageSeo from "@/components/PageSeo";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { latestItems } from "@/lib/latestContent";

const LatestPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <PageSeo
        title="Latest from Isaac Seiler | AI, OpenAI, Summation, and Public Technology"
        description="Recent writing and updates from Isaac Seiler on Summation AI, OpenAI's ChatGPT Lab and Student Collective, AI education, public technology, WashU, and the Truman Scholarship."
        path="/latest"
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
        <main className="latest-page-shell">
          <header className="latest-page-header">
            <p>Writing & updates</p>
            <h1>Latest from isaacseiler.xyz</h1>
            <div>
              <p>Notes on artificial intelligence, education, public institutions, communications, and the systems people use every day.</p>
              <a href="/feed.xml">RSS feed <ArrowUpRight aria-hidden="true" /></a>
            </div>
          </header>

          <section className="latest-page-grid" aria-label="Latest articles">
            {latestItems.map((item, index) => (
              <Link key={item.slug} to={`/latest/${item.slug}`} className="latest-page-card group">
                <div className="latest-page-card-image">
                  <img src={item.image} alt={item.imageAlt} loading={index < 2 ? "eager" : "lazy"} decoding="async" />
                </div>
                <div className="latest-page-card-meta">
                  <span>{item.category}</span>
                  <time dateTime={item.published}>{item.displayDate}</time>
                </div>
                <h2>{item.title}</h2>
                <p>{item.excerpt}</p>
                <span className="latest-page-card-link">Read note <ArrowUpRight aria-hidden="true" /></span>
              </Link>
            ))}
          </section>
        </main>
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

export default LatestPage;
