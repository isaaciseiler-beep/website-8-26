import { useSidebarState } from "@/lib/siteChrome";
import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import './about-page.css';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import SiteHeader from '@/components/SiteHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigationMotion } from '@/hooks/useMotionPreference';
import { PROFILE_SUMMARY } from '@/lib/siteIdentity.mjs';

const fields=['AI','public policy','education','research','journalism','communications'];
function AreaCycle(){
  const [index,setIndex]=useState(0);
  const [width,setWidth]=useState<number>();
  const measure=useRef<HTMLSpanElement>(null);
  const interacted=useRef(false);
  const advance=(direction=1)=>{interacted.current=true;setIndex(value=>(value+fields.length+direction)%fields.length);};
  const reduced=useMotionPreference();
  useLayoutEffect(()=>{
    const node=measure.current;if(!node)return;
    const resize=()=>setWidth(node.getBoundingClientRect().width);
    resize();const observer=new ResizeObserver(resize);observer.observe(node);return()=>observer.disconnect();
  },[]);
  return <><motion.button type="button" className="about-pill about-cycle" aria-label={`${fields[index]}. Show next`} aria-describedby="about-cycle-hint" aria-live="polite" aria-atomic="true" onClick={()=>advance()} onKeyDown={event=>{if(event.shiftKey&&event.key==='Enter'){event.preventDefault();advance(-1);}}} initial={false} animate={width?{width}:{}} transition={{duration:reduced?0:.18}}>
    <span ref={measure} className="about-cycle-measure" aria-hidden="true">{fields[index]}</span><motion.span key={index} initial={reduced||!interacted.current?false:{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.18}}>{fields[index]}</motion.span>
  </motion.button></>;
}
function Intro(){
  const pieces=PROFILE_SUMMARY.split(/(Seattle-based|AI,|Summation|enterprise,)/);
  return <p className="about-display">{pieces.map((text,index)=>text==='AI,'?<span className="about-phrase" key={index}><AreaCycle/>,</span>:text==='Seattle-based'?<Link key={index} className="about-pill" to="/?album=washington-state">{text}</Link>:text==='Summation'?<Link key={index} className="about-pill" to="/work">{text}</Link>:text==='enterprise,'?<span className="about-phrase" key={index}><Link className="about-pill" to="/projects/boehringer-cares-foundation-rebrand-strategy-shift">enterprise</Link>,</span>:text)}</p>;
}
export default function AboutPage() {
  const [sidebarOpen, setSidebarOpen] = useSidebarState();
  const [searchOpen, setSearchOpen] = useState(false);
  const mobile = useIsMobile();
  const navigationMotion = useNavigationMotion(sidebarOpen || searchOpen);
  const offset = !mobile && sidebarOpen;
  const toggleSidebar = () => { setSearchOpen(false); setSidebarOpen(open => !open); };
  const openSearch = () => { setSidebarOpen(false); setSearchOpen(true); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} onClose={() => setSidebarOpen(false)} onSearchOpen={openSearch} activeSection="about" showToggle={false} />
      <motion.main
        className="min-h-screen px-6 pb-24 pt-32 md:pt-40"
        animate={{ marginLeft: sidebarOpen && !mobile ? 200 : 0, marginRight: 0, width: offset ? 'calc(100% - 200px)' : '100%' }}
        transition={navigationMotion}
      >
        <article className="about-article mx-auto">
          <h1 className="mb-8 text-3xl font-medium tracking-tight">About</h1>
          <p id="about-cycle-hint" className="sr-only">Some phrases are links. The area of work button cycles on Enter or Space; Shift plus Enter goes back.</p>
          <Intro/>
          <div className="about-body space-y-6 text-lg leading-relaxed">
            <p>Previously, Isaac helped build a <Link to="/projects/congressional-office-setup-100-day-report">congressional office</Link> and managed communications for a Member of Congress, led AI literacy work with educators in <Link to="/projects/fulbright-focus-group-sponsored-by-openai">Taiwan</Link> with support from OpenAI, and researched how AI and digital platforms affect <Link to="/projects/senior-thesis-local-journalism">journalism</Link>.</p>
            <p>He is a Fulbright and Truman Scholar and a member of OpenAI’s <Link to="/projects/openai-product-testing-and-feedback">ChatGPT Lab</Link>.</p>
          </div>
        </article>
      </motion.main>
      <SiteHeader open={sidebarOpen} onToggle={toggleSidebar} searchOpen={searchOpen} onSearchOpen={openSearch} onSearchClose={() => setSearchOpen(false)} />
    </div>
  );
}
