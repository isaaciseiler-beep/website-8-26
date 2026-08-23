import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { curatedPicks } from "@/lib/photoAlbums";
import { projectItems } from "@/lib/siteContent";
import { profilePhotoUrl } from "@/lib/tileImages";
import {
  CALENDAR_URL,
  CONTACT_EMAIL,
  CONTACT_MAILTO,
  GITHUB_URL,
  LINKEDIN_URL,
} from "@/lib/site";

interface ClassicWindowProps {
  id?: string;
  title: string;
  children: ReactNode;
  className?: string;
  status?: string;
}

const ClassicWindow = ({ id, title, children, className = "", status }: ClassicWindowProps) => (
  <section id={id} className={`win-window ${className}`.trim()} aria-label={title}>
    <div className="win-titlebar">
      <span className="win-titlebar-icon" aria-hidden="true">▣</span>
      <h2>{title}</h2>
      <span className="win-titlebar-controls" aria-hidden="true">
        <i>_</i><i>□</i><i>×</i>
      </span>
    </div>
    <div className="win-menubar" aria-hidden="true">
      <span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>H</u>elp</span>
    </div>
    <div className="win-window-content">{children}</div>
    {status ? <div className="win-statusbar"><span>{status}</span></div> : null}
  </section>
);

const desktopLinks = [
  { label: "My Computer", symbol: "▥", to: "/#skull-top" },
  { label: "ABOUT.TXT", symbol: "▤", to: "/#skull-about" },
  { label: "WORK", symbol: "▦", to: "/#skull-work" },
  { label: "PHOTOS", symbol: "▧", to: "/#skull-photos" },
  { label: "CONTACT", symbol: "✉", to: "/#skull-contact" },
];

const photos = curatedPicks.slice(0, 12);
const projects = projectItems.slice(0, 10);

const SkullHome = () => {
  const location = useLocation();
  const { exitSkullMode } = useTheme();
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    const pathTarget = location.pathname === "/about"
      ? "skull-about"
      : location.pathname === "/work"
        ? "skull-work"
        : location.hash.replace(/^#/, "") || "skull-top";
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(pathTarget);
      if (target) target.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.pathname]);

  const showPreviousPhoto = () => {
    setSelectedPhoto((current) => (current - 1 + photos.length) % photos.length);
  };

  const showNextPhoto = () => {
    setSelectedPhoto((current) => (current + 1) % photos.length);
  };

  const activePhoto = photos[selectedPhoto];

  return (
    <main id="skull-top" className="win-shell win-desktop">
      <nav className="win-desktop-icons" aria-label="Skull mode desktop shortcuts">
        {desktopLinks.map((item) => (
          <Link key={item.label} className="win-desktop-icon" to={item.to}>
            <span className="win-desktop-icon-picture" aria-hidden="true">{item.symbol}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="win-desktop-workspace">
        <section className="win-window win-browser" aria-label="Isaac Seiler home page">
          <div className="win-titlebar">
            <span className="win-titlebar-icon" aria-hidden="true">e</span>
            <h1>Isaac Seiler's Home Page - Microsoft Internet Explorer</h1>
            <span className="win-titlebar-controls" aria-hidden="true">
              <i>_</i><i>□</i><i>×</i>
            </span>
          </div>
          <div className="win-menubar" aria-hidden="true">
            <span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>G</u>o</span><span>F<u>a</u>vorites</span><span><u>H</u>elp</span>
          </div>
          <nav className="win-toolbar" aria-label="Page shortcuts">
            <Link to="/#skull-top"><span aria-hidden="true">◀</span> Back</Link>
            <Link to="/#skull-work"><span aria-hidden="true">▶</span> Work</Link>
            <Link to="/#skull-photos"><span aria-hidden="true">▧</span> Photos</Link>
            <Link to="/#skull-contact"><span aria-hidden="true">⌂</span> Contact</Link>
          </nav>
          <div className="win-addressbar">
            <span>Address</span>
            <div aria-label="Current address">C:\ISAAC\HOME.HTM</div>
          </div>
          <div className="win-browser-page">
            <div className="win-home-banner">
              <p className="win-home-kicker">WELCOME TO MY PERSONAL WEB SITE</p>
              <h2>Isaac Seiler</h2>
              <div className="win-rule" />
              <p>Strategy, communications, technology, and public-interest work.</p>
              <p className="win-under-construction"><span aria-hidden="true">⚠</span> This page is always under construction. <span aria-hidden="true">⚠</span></p>
              <nav className="win-home-links" aria-label="Main sections">
                <Link to="/#skull-about">ABOUT ME</Link>
                <Link to="/#skull-work">MY WORK</Link>
                <Link to="/#skull-photos">PHOTO ALBUM</Link>
                <Link to="/#skull-contact">E-MAIL ME</Link>
              </nav>
            </div>
          </div>
          <div className="win-statusbar"><span>Done</span><span>Internet zone</span></div>
        </section>

        <ClassicWindow id="skull-about" title="ABOUT.TXT - Notepad" status="1,247 bytes">
          <div className="win-notepad-layout">
            <div className="win-profile-frame">
              <img src={profilePhotoUrl} alt="Isaac Seiler" loading="eager" decoding="async" />
              <span>ISAAC.JPG</span>
            </div>
            <div className="win-notepad-copy">
              <p>I'm on the team at <a href="https://summation.com" target="_blank" rel="noopener noreferrer">Summation</a>, helping tell the story of how AI is changing the way people work. My background spans government and large enterprise, including senior roles at the U.S. House and published work with OpenAI.</p>
              <p>Based in Seattle, WA.</p>
              <p>Previously: congressional communications, international research, journalism, and a variety of projects about technology and public institutions.</p>
            </div>
          </div>
        </ClassicWindow>

        <ClassicWindow id="skull-work" title="C:\ISAAC\WORK" className="win-work-window" status={`${projects.length} object(s)`}>
          <div className="win-explorer-toolbar" aria-hidden="true">
            <span>File</span><span>Edit</span><span>View</span><span>Tools</span>
          </div>
          <div className="win-explorer-headings" aria-hidden="true">
            <span>Name</span><span>Type</span><span>Year</span><span>Description</span>
          </div>
          <div className="win-file-list">
            {projects.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`} className="win-file-row">
                <span className="win-file-name"><b aria-hidden="true">▤</b>{project.title}</span>
                <span>{project.source}</span>
                <span>{project.year}</span>
                <span>{project.summary}</span>
              </Link>
            ))}
          </div>
        </ClassicWindow>

        <ClassicWindow id="skull-photos" title="PHOTO VIEWER 3.1" className="win-photo-window" status={`${selectedPhoto + 1} of ${photos.length} files selected`}>
          <div className="win-photo-layout">
            <div className="win-photo-files" role="listbox" aria-label="Photo files">
              {photos.map((photo, index) => (
                <button
                  key={photo.url}
                  type="button"
                  role="option"
                  aria-selected={selectedPhoto === index}
                  className={selectedPhoto === index ? "is-selected" : ""}
                  onClick={() => setSelectedPhoto(index)}
                >
                  <span aria-hidden="true">▧</span>
                  {`PHOTO_${String(index + 1).padStart(2, "0")}_${photo.location.toUpperCase().replaceAll(" ", "_")}.BMP`}
                </button>
              ))}
            </div>
            <figure className="win-photo-preview">
              <div className="win-photo-canvas">
                <img src={activePhoto.url} alt={`Travel photograph from ${activePhoto.location}`} decoding="async" />
              </div>
              <figcaption>{activePhoto.location} — {`PHOTO_${String(selectedPhoto + 1).padStart(2, "0")}.BMP`}</figcaption>
              <div className="win-photo-controls">
                <button type="button" onClick={showPreviousPhoto}>◀ Previous</button>
                <button type="button" onClick={showNextPhoto}>Next ▶</button>
              </div>
            </figure>
          </div>
        </ClassicWindow>

        <ClassicWindow id="skull-contact" title="Control Panel - Internet" className="win-contact-window" status="Ready">
          <div className="win-contact-grid">
            <a href={CONTACT_MAILTO}><span aria-hidden="true">✉</span><b>E-Mail</b><small>{CONTACT_EMAIL}</small></a>
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">in</span><b>LinkedIn</b><small>Professional network</small></a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">&lt;/&gt;</span><b>GitHub</b><small>Code and projects</small></a>
            <a href={CALENDAR_URL} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">31</span><b>Calendar</b><small>Schedule a meeting</small></a>
          </div>
          <div className="win-dialog">
            <span className="win-dialog-icon" aria-hidden="true">i</span>
            <p>Finished browsing the old computer?</p>
            <button type="button" className="win-button" onClick={exitSkullMode}>Return to normal site</button>
          </div>
        </ClassicWindow>

        <footer className="win-page-footer">
          <p>Best viewed at 800 × 600 with 256 colors.</p>
          <p>© 1995–2026 Isaac Seiler. No cookies were harmed in the making of this web site.</p>
        </footer>
      </div>
    </main>
  );
};

export default SkullHome;
