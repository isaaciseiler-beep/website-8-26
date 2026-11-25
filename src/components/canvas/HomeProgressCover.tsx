import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import MacintoshFrame from './MacintoshFrame';
import './home-explore.css';
import './macintosh-frame.css';

let bootCompleted = false;
type BootStage = 'power' | 'happy-mac' | 'welcome' | 'ready';

export default function HomeProgressCover() {
  const reducedMotion = useMotionPreference();
  const [stage, setStage] = useState<BootStage>(() => bootCompleted || reducedMotion ? 'ready' : 'power');

  useEffect(() => {
    if (bootCompleted || reducedMotion) return;
    const timers = [
      window.setTimeout(() => setStage('happy-mac'), 650),
      window.setTimeout(() => setStage('welcome'), 1900),
      window.setTimeout(() => { bootCompleted = true; setStage('ready'); }, 4800),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [reducedMotion]);

  const ready = reducedMotion || stage === 'ready';
  return (
    <section id="home-genui" className="home-genui home-genui-mac photos-shell" aria-label="Work in progress">
      <MacintoshFrame>
        {!ready && <div className="macintosh-boot" data-stage={stage} role="status" aria-label="Macintosh is starting up">
          {/* Original monochrome System startup captures, not a modern progress UI.
              Source: thewessens.net/collection/apple/systems/EarlyMacSystems.html */}
          {stage !== 'power' && <img
            className="macintosh-boot-screen"
            src={stage === 'welcome' ? '/devices/startup-mac-welcome.png' : '/devices/startup-happy-mac.png'}
            alt={stage === 'welcome' ? 'Welcome to Macintosh.' : 'Happy Mac startup icon'}
            width="512" height="342" draggable={false}
          />}
        </div>}
        {ready && <div className="macintosh-progress">
          <p>This part of the site is a work in progress</p>
          <Link to="/work">View work</Link>
        </div>}
      </MacintoshFrame>
    </section>
  );
}
