import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right.js";

export interface ProjectSourceLink {
  label: string;
  href: string;
  wide?: boolean;
}

interface ProjectSourceLinksProps {
  links: ProjectSourceLink[];
  label?: string;
  compact?: boolean;
}

const ProjectSourceLinks = ({ links, label, compact = false }: ProjectSourceLinksProps) => (
  <div className={`project-source-links ${compact ? "project-source-links--compact" : ""}`}>
    {label && <p className="project-source-links-label">{label}</p>}
    <div className="project-source-links-grid">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`project-source-link ${link.wide ? "project-source-link-wide" : ""}`}
        >
          <span className="project-source-link-label">{link.label}</span>
          <span className="project-source-link-action" aria-hidden="true">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </a>
      ))}
    </div>
  </div>
);

export default ProjectSourceLinks;
