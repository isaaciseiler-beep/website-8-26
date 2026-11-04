import { ArrowUpRight } from 'lucide-react';
import { experiencePrompts } from '@/lib/experiencePrompts';
import { CONTACT_EMAIL } from '@/lib/site';

const starters = ['career', 'taiwan', 'policy', 'congress'].flatMap(id => experiencePrompts.find(prompt => prompt.id === id) ?? []);

export default function ExploreGuide({ onExplore }: { onExplore: (question: string) => void }) {
  const feedbackHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Portfolio feedback')}&body=${encodeURIComponent('My feedback:\n\nQuestion I tried:\n\nWhat I expected:\n\nWhat happened:\n\nPage: ' + window.location.href)}`;

  return <section className="home-explore-guide" aria-label="Explore guide">
    <header className="home-guide-heading">
      <h2 tabIndex={-1}>How to explore</h2>
      <p>Start with a question, then follow the work. Or ask your own above.</p>
    </header>
    <ul className="home-guide-starters" aria-label="Questions to try">
      {starters.map(question => <li key={question.id}>
        <button type="button" onClick={() => onExplore(question.text)}><span>{question.text}</span><ArrowUpRight size={20} aria-hidden="true" /></button>
      </li>)}
    </ul>
    <section className="home-guide-technical" aria-label="How it works">
      <h3>How it works</h3>
      <p>Explore matches your question to Isaac’s published work. When available, Mistral chooses from known projects, evidence, and layouts. The server validates the selection, and React renders the interactive view. The model does not generate executable UI code or new portfolio facts.</p>
      <details className="home-guide-about">
        <summary>About answers &amp; privacy</summary>
        <p>Submitted questions and current view settings can go to Mistral and an optional Typesafe/Jev routing service. Typing and changing filters stay local. You can explore the authored views even when AI is unavailable.</p>
      </details>
    </section>
    <div className="home-guide-feedback">
      <p>What could be better? Tell Isaac what felt useful, confusing, or missing.</p>
      <a className="home-guide-feedback-button" href={feedbackHref}>Send feedback <ArrowUpRight size={16} aria-hidden="true" /></a>
    </div>
  </section>;
}
