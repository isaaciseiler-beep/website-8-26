import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_MAILTO, GITHUB_URL, LINKEDIN_URL } from '@/lib/site';

const BUILD_STAMP = typeof __SITE_BUILD_DATE__ === 'string' ? __SITE_BUILD_DATE__ : new Date().toISOString().slice(0, 10);
const BUILD_DATE = new Date(`${BUILD_STAMP}T00:00:00Z`);
const updated = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(BUILD_DATE);

function seattleTime(now = new Date()) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(now);
}

export default function Footer() {
  const [time, setTime] = useState(seattleTime);
  useEffect(() => {
    const id = window.setInterval(() => setTime(seattleTime()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <footer className="site-colophon">
      <p className="site-colophon-signoff"><Link to="/?q=How%20can%20I%20contact%20Isaac%3F">Say hello <span aria-hidden="true">→</span></Link></p>
      <nav className="site-colophon-links" aria-label="Site">
        <Link to="/work">Work</Link>
        <Link to="/about">About</Link>
        <Link to="/">Photographs</Link>
        <a href={CONTACT_MAILTO}>Email</a>
        <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">LinkedIn</a>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
      </nav>
      <p className="site-colophon-meta">
        <span className="is-sans">Set in Satoshi</span>
        <span>Built with React</span>
        <time dateTime={new Date().toISOString()}>{time} Seattle</time>
        <span>Updated {updated}</span>
      </p>
    </footer>
  );
}
