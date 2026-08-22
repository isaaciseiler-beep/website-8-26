import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, useMotionValue } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import { featuredProjectIds, projectItems } from "@/lib/siteContent";

const featuredProjects = featuredProjectIds
  .slice(0, 4)
  .map((id) => projectItems.find((project) => project.id === id))
  .filter(Boolean);

const BUFFER = 24;
const GAP = 3;

const FeaturedTile = ({
  image,
  alt,
  filter,
  canHover,
  children,
  className = "",
}: {
  image: string;
  alt: string;
  filter: ReturnType<typeof useTransform> | ReturnType<typeof useMotionValue>;
  canHover: boolean;
  children: React.ReactNode;
  className?: string;
}) => {
  const [hovered, setHovered] = useState(false);
  const showColor = canHover && hovered;

  return (
    <div
      className={`relative overflow-hidden cursor-pointer ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-full h-full overflow-hidden">
        <motion.img
          src={image}
          alt={alt}
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover"
          style={{
            filter: showColor ? "grayscale(0%)" : filter,
            transition: showColor ? "filter 0.4s ease-out" : undefined,
          }}
        />
      </div>
      {children}
    </div>
  );
};

const FeaturedSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isOutPhase, setIsOutPhase] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Track when we've entered the out phase (past midpoint)
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setIsOutPhase(v > 0.50);
  });

  const padding = useTransform(
    scrollYProgress,
    [0, 0.10, 0.30, 0.46, 0.78, 0.92, 1],
    [BUFFER, BUFFER, 0, 0, 0, BUFFER, BUFFER]
  );

  const topFilter = useMotionValue("grayscale(0%)");
  const blFilter = useMotionValue("grayscale(0%)");
  const brFilter = useMotionValue("grayscale(0%)");

  if (isMobile) {
    return (
      <section className="relative">
        <div className="px-6 pt-12 pb-4">
          <SectionHeading className="mb-0">Featured</SectionHeading>
        </div>
        <div className="site-corner mx-6 mb-12 flex flex-col gap-[3px] overflow-hidden">
          {featuredProjects.map((p, i) => (
            <div key={p!.id} className="relative aspect-[4/3] overflow-hidden">
              <img
                src={p!.image}
                alt={p!.title}
                className="w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchpriority={i === 0 ? "high" : "auto"}
              />
              <div
                className="absolute bottom-0 left-0 right-0 p-4"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)" }}
              >
                <h3 className="text-2xl font-semibold tracking-tighter text-white leading-tight">
                  {p!.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative" style={{ height: "200vh" }}>
      <div className="sticky top-0 h-screen flex flex-col overflow-hidden">
        <div className="px-6 pt-[68px] pb-4">
          <SectionHeading className="mb-0">Featured</SectionHeading>
        </div>

        <motion.div
          className="site-corner flex min-h-0 flex-1 flex-col overflow-hidden"
          style={{
            paddingLeft: padding,
            paddingRight: padding,
            paddingBottom: padding,
            gap: GAP,
          }}
        >
          {/* Hero card */}
          <FeaturedTile
            image={featuredProjects[0]!.image}
            alt={featuredProjects[0]!.title}
            filter={topFilter}
            canHover={isOutPhase}
            className="flex-1 min-h-0"
          >
            <div
              className="absolute bottom-0 left-0 right-0 p-3"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
              }}
            >
              <h3 className="text-[2rem] md:text-[3.25rem] font-semibold tracking-tighter text-white leading-tight">
                {featuredProjects[0]!.title}
              </h3>
            </div>
          </FeaturedTile>

          {/* Bottom thumbnails */}
          <div className="grid grid-cols-3 shrink-0" style={{ gap: GAP, height: "28vh" }}>
            {featuredProjects.slice(1).map((project, index) => (
              <FeaturedTile
                key={project!.id}
                image={project!.image}
                alt={project!.title}
                filter={index === 0 ? blFilter : brFilter}
                canHover={isOutPhase}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 p-3"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)",
                  }}
                >
                  <h3 className="text-base md:text-[1.35rem] font-semibold tracking-tighter text-white leading-tight">
                    {project!.title}
                  </h3>
                </div>
              </FeaturedTile>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedSection;
