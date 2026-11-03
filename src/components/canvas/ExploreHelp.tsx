import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { MOTION_DURATION, MOTION_EASE_ENTER } from '@/lib/motion';
import { CONTACT_EMAIL } from '@/lib/site';
import { startingExperiencePrompts } from '@/lib/experiencePrompts';

/** An authored answer in the same pane as every exploration. It is available
 * immediately, including when the composition service is unavailable. */
export default function ExploreHelp({onSubmit}:{onSubmit:(question:string)=>void}) {
  const reduced=useMotionPreference();
  const reveal=(index:number)=>({initial:{opacity:reduced?1:0},animate:{opacity:1},transition:{duration:reduced?0:MOTION_DURATION.base,delay:reduced?0:.12+index*.09,ease:MOTION_EASE_ENTER}});
  const body=['My feedback:','','Question I tried:','','What I expected:','','What happened:','','Page: '+window.location.href].join('\n');
  const href=`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Portfolio feedback')}&body=${encodeURIComponent(body)}`;
  return <article className="home-explore-help" aria-label="How to explore">
    <motion.div {...reveal(0)}>
      <h2>Start with a little curiosity.</h2>
      <p className="home-help-lead">Ask about Isaac’s work, or start here.</p>
      <div className="home-help-questions">{startingExperiencePrompts.map(item=><button key={item.id} type="button" onClick={()=>onSubmit(item.text)}>{item.text}<ArrowRight size={16} aria-hidden="true"/></button>)}</div>
      <p>Ask a follow-up to go deeper, or use an answer’s controls to explore. Back retraces your steps; Clear starts fresh.</p>
    </motion.div>
    <motion.section {...reveal(1)} aria-labelledby="explore-how-it-works">
      <h3 id="explore-how-it-works">How it works</h3>
      <p>Your question shapes an interactive view of Isaac’s published work. A local match appears first; when available, AI chooses the projects, evidence, and layout that fit your question.</p>
      <details><summary>Technical details</summary><div>
        <p>React renders a fixed set of portfolio components. Mistral selects from known content and controls; the server validates its response. It does not generate executable UI code or new portfolio facts.</p>
        <p>Submitted questions and the current view can go to Mistral and an optional Typesafe/Jev routing service. Typing and changing filters stay local. Request versions prevent an older answer from replacing a newer one.</p>
      </div></details>
    </motion.section>
    <motion.section {...reveal(2)} aria-labelledby="explore-feedback">
      <h3 id="explore-feedback">Help make this better</h3>
      <p>Was anything confusing, surprising, or missing? Tell Isaac what you tried and what you hoped to find.</p>
      <a className="home-help-feedback" href={href}>Send feedback<ArrowUpRight size={16} aria-hidden="true"/></a>
    </motion.section>
  </article>;
}
