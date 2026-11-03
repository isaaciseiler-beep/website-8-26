import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProjectStory, ProjectComparison } from '@/components/canvas/PortfolioViews';
import { ProjectIndex } from '@/components/canvas/LayoutViews';
import BenchmarkExplorer from '@/components/canvas/BenchmarkExplorer';
import { PublishedSources } from '@/components/canvas/PublishedSources';
import { blankBlock, type CanvasBlock } from '@/lib/genui';
import { evidenceForSection } from '@/lib/portfolioEvidenceRegistry';
import { publicProjects } from '@/lib/canvas';
import { representativeProjectImage } from '@/components/canvas/projectVisual';
const congress='congressional-office-setup-100-day-report';
const brand='boehringer-cares-foundation-rebrand-strategy-shift';
function Story({initial}:{initial:CanvasBlock}){const [block,setBlock]=useState(initial);return <ProjectStory block={block} onChange={setBlock}/>;}
function Work(){const [block,setBlock]=useState(blankBlock('collection'));return <ProjectIndex block={block} onChange={setBlock}/>;}
afterEach(cleanup);
describe('answer reading and evidence provenance',()=>{
  it('represents a symmetric comparison with actual project columns and dimension row headers',()=>{
    render(<ProjectComparison block={{...blankBlock('comparison'),projectIds:[congress,brand],focus:'process'}} onChange={()=>{}}/>);
    const table=screen.getByRole('table',{name:'Published project comparison'});
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
    expect(within(table).getAllByRole('rowheader').map(row=>row.textContent)).toEqual(['Approach','Work in practice']);
    expect(within(table).getAllByRole('cell').filter(cell=>cell.textContent)).toHaveLength(4);
  });
  it('distinguishes Taiwan from the ChatGPT Lab using their actual published media rather than their shared legacy cover',()=>{
    const taiwan=publicProjects.find(project=>project.id==='fulbright-focus-group-sponsored-by-openai')!;
    const lab=publicProjects.find(project=>project.id==='openai-product-testing-and-feedback')!;
    expect(taiwan.image).toBe(lab.image); // The misleading legacy-cover collision.
    const taiwanImage=representativeProjectImage(taiwan),labImage=representativeProjectImage(lab);
    expect(taiwanImage.src).not.toBe(labImage.src);
    expect(taiwanImage.alt).toMatch(/presenting.*Taiwan/);
    expect(labImage.alt).toMatch(/100 Chats/);
    render(<ProjectComparison block={{...blankBlock('comparison'),projectIds:[lab.id,taiwan.id]}} onChange={()=>{}}/>);
    const images=document.querySelectorAll('.portfolio-comparison-media img');
    expect([...images].map(image=>image.getAttribute('src'))).toEqual([labImage.src,taiwanImage.src]);
    expect(new Set([...images].map(image=>image.getAttribute('src'))).size).toBe(2);
  });
  it('lets a visitor change the compared project directly from its visible identity control',()=>{
    function Comparison(){const [block,setBlock]=useState({...blankBlock('comparison'),projectIds:[congress,brand],focus:'process' as const});return <ProjectComparison block={block} onChange={next=>setBlock(next as typeof block)}/>;}
    render(<Comparison/>);
    const first=screen.getByRole('combobox',{name:'Comparison project 1'});
    expect(within(first).queryByRole('option',{name:'Bringing Boehringer Cares to life'})).not.toBeInTheDocument();
    first.focus();
    fireEvent.change(first,{target:{value:'fulbright-focus-group-sponsored-by-openai'}});
    expect(screen.getByRole('combobox',{name:'Comparison project 1'})).toHaveFocus();
    expect(screen.getByRole('button',{name:'Process'})).toHaveAttribute('aria-pressed','true');
    expect(screen.getByRole('columnheader',{name:'AI literacy in Taiwan'})).toBeInTheDocument();
  });
  it('keeps every process chapter accessible through the compact section control',()=>{
    render(<Story initial={{...blankBlock('story'),projectIds:[congress],layout:'project-process',focus:'process',section:1}}/>);
    fireEvent.change(screen.getByRole('combobox',{name:'Project section'}),{target:{value:'5'}});
    expect(screen.getByRole('heading',{name:'Making the first 100 days measurable'})).toBeVisible();
    expect(screen.getByRole('button',{name:'Process'})).toHaveAttribute('aria-pressed','true');
    expect(screen.getByRole('combobox',{name:'Project section'})).toHaveValue('5');
  });
  it('explores actual Lab products and retains the selected product across work, publication and source views',()=>{
    render(<Story initial={{...blankBlock('story'),projectIds:['openai-product-testing-and-feedback']}}/>);
    const products=screen.getByRole('combobox',{name:'Lab work to explore'});
    fireEvent.change(products,{target:{value:'4'}});
    expect(screen.getByRole('button',{name:'Products'})).toHaveAttribute('aria-pressed','true');
    expect(screen.getByText(/Pulse flipped the usual interaction/)).toBeVisible();
    expect(screen.getByText(/My feedback focused on making those moments easier to find and trust/)).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Published'}));
    expect(products).toHaveValue('4');
    expect(screen.getByText(/launch story featured my experience using calendar context/)).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Sources'}));
    expect(products).toHaveValue('4');
    expect(screen.getByRole('link',{name:'Meet ChatGPT Pulse'})).toBeVisible();
    expect(screen.queryByRole('link',{name:'Explore the 100 Chats Project'})).not.toBeInTheDocument();
    fireEvent.change(products,{target:{value:'5'}});
    expect(screen.getByRole('button',{name:'Sources'})).toHaveAttribute('aria-pressed','true');
    expect(screen.getByRole('link',{name:'Meet ChatGPT Atlas'})).toBeVisible();
    expect(screen.queryByRole('link',{name:'Meet ChatGPT Pulse'})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Products'}));
    expect(products).toHaveValue('5');
    expect(screen.getByText(/I tested a basic premise/)).toBeVisible();
  });
  it('keeps the complete Lab overview and reviewed lessons reachable through the same native control',()=>{
    render(<Story initial={{...blankBlock('story'),projectIds:['openai-product-testing-and-feedback'],focus:'process',layout:'project-process',section:4}}/>);
    const products=screen.getByRole('combobox',{name:'Lab work to explore'});
    fireEvent.change(products,{target:{value:'7'}});
    expect(screen.getByRole('button',{name:'Published'})).toHaveAttribute('aria-pressed','true');
    expect(screen.getByText(/connecting what a team built to the messy way a person/)).toBeVisible();
    fireEvent.change(products,{target:{value:'0'}});
    expect(screen.getByRole('button',{name:'Role'})).toHaveAttribute('aria-pressed','true');
    expect(screen.getByText(/first ChatGPT Lab cohort/)).toBeVisible();
    expect(screen.getByRole('button',{name:'Explore the products'})).toBeVisible();
  });
  it('recovers failed Atlas media through its reviewed poster and local cover without losing the selected product',()=>{
    const lab=publicProjects.find(project=>project.id==='openai-product-testing-and-feedback')!;
    const atlas=representativeProjectImage(lab,5);
    const reviewedPoster=lab.sections[5].media!.find(media=>media.fallbackPoster)!.fallbackPoster!;
    expect(atlas.fallbacks[0].src).toBe(reviewedPoster);
    render(<Story initial={{...blankBlock('story'),projectIds:[lab.id],focus:'process',layout:'project-process',section:5}}/>);
    const product=screen.getByRole('combobox',{name:'Lab work to explore'});
    const image=document.querySelector('.portfolio-project-image') as HTMLImageElement;
    image.dataset.imageState='error'; // The global preloader marks a failed asset.
    fireEvent.error(image);
    expect(image).toHaveAttribute('src',reviewedPoster);
    expect(image.closest('a')).toHaveAttribute('href',reviewedPoster);
    expect(image).not.toHaveAttribute('data-image-state','error');
    expect(screen.getByText('Video poster')).toHaveClass('sr-only');
    expect(image.closest('figure')?.querySelector('figcaption')).toHaveTextContent('Atlas');
    expect(product).toHaveValue('5');
    fireEvent.error(image);
    expect(image).toHaveAttribute('src',lab.image);
    expect(image.closest('a')).toHaveAttribute('href',lab.image);
    expect(image).toHaveAttribute('alt',`Project cover for ${lab.title}`);
    expect(screen.getByText('Project cover')).toHaveClass('sr-only');
    fireEvent.load(image);
    expect(image).toHaveAttribute('data-image-state','ready');
    fireEvent.change(product,{target:{value:'4'}});
    expect(product).toHaveValue('4');
    expect(image).toHaveAttribute('src',representativeProjectImage(lab,4).src);
    expect(screen.queryByText('Project cover')).not.toBeInTheDocument();
    expect(image).not.toHaveAttribute('data-image-state','error');
  });
  it('keeps project source links available from the contribution overview',()=>{
    render(<Story initial={{...blankBlock('story'),projectIds:[congress]}}/>);
    const source=screen.getByText('Sources').closest('details')!;
    expect(source.open).toBe(false);
    fireEvent.click(screen.getByText('Sources'));
    expect(within(source).getAllByRole('link').length).toBeGreaterThan(0);
  });
  it('retains useful link names and describes the new-tab behavior',()=>{
    render(<PublishedSources context="The research" links={[{label:'Read the thesis',href:'https://example.com/thesis'},{label:'Duplicate',href:'https://example.com/thesis'}]} open/>);
    const source=screen.getByRole('group',{name:'Sources for The research'});
    expect(within(source).getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link',{name:'Duplicate'})).toHaveAccessibleDescription('Opens in a new tab.');
  });
  it('reads a multi-part answer across sections and opens its original context',()=>{
    const contribution=evidenceForSection(congress,0).filter(item=>item.kind==='paragraph')[0];
    const outcomes=evidenceForSection(congress,5).filter(item=>item.kind==='paragraph')[0];
    render(<Story initial={{...blankBlock('story'),projectIds:[congress],answerPlan:{version:1,facets:[{kind:'contribution',status:'supported',evidenceIds:[contribution.id]},{kind:'outcomes',status:'supported',evidenceIds:[outcomes.id]}]}}}/>);
    expect(screen.getByRole('heading',{name:'Isaac’s contribution'})).toBeVisible();
    expect(screen.getByRole('heading',{name:'Published outcomes'})).toBeVisible();
    expect(screen.getByText(contribution.text)).toBeVisible();
    expect(screen.getByText(outcomes.text)).toBeVisible();
    fireEvent.click(screen.getByText('Read in context'));
    fireEvent.click(screen.getByRole('button',{name:outcomes.sectionHeading}));
    expect(screen.getByRole('button',{name:'Evidence'})).toHaveAttribute('aria-pressed','true');
    expect(screen.getByText(outcomes.sectionHeading).closest('details')!.open).toBe(true);
  });
  it('gives repeated evidence one home and exposes the limits of a partial answer',()=>{
    const passage=evidenceForSection(congress,0).find(item=>item.kind==='paragraph')!;
    render(<Story initial={{...blankBlock('story'),projectIds:[congress],answerPlan:{version:1,facets:[{kind:'contribution',status:'supported',evidenceIds:[passage.id]},{kind:'process',status:'limited',evidenceIds:[passage.id]},{kind:'limits',status:'unavailable',evidenceIds:[]}]}}}/>);
    expect(screen.getAllByText(passage.text)).toHaveLength(1);
    expect(screen.getByRole('heading',{name:'Isaac’s contribution and approach'})).toBeVisible();
    expect(screen.queryByText(/Covered by the passage/)).not.toBeInTheDocument();
    expect(screen.getByText(/only partially covers the approach/)).toBeVisible();
    expect(screen.getByText(/does not establish this part/)).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Process'}));
    expect(screen.queryByText(/does not establish this part/)).not.toBeInTheDocument();
  });
  it('merges a fully shared supported question part into one useful heading',()=>{
    const passages=[...evidenceForSection(congress,0),...evidenceForSection(congress,5)].filter(item=>item.kind==='paragraph').slice(0,3);
    render(<Story initial={{...blankBlock('story'),projectIds:[congress],answerPlan:{version:1,facets:[{kind:'process',status:'supported',evidenceIds:passages.slice(0,2).map(item=>item.id)},{kind:'outcomes',status:'supported',evidenceIds:[passages[1].id]}]}}}/>);
    expect(screen.getByRole('heading',{name:'Approach and published outcomes'})).toBeVisible();
    expect(screen.queryByRole('heading',{name:'Published outcomes'})).not.toBeInTheDocument();
    expect(screen.getAllByText(passages[1].text)).toHaveLength(1);
    expect(document.querySelector('[data-answer-facets="process outcomes"]')).toBeTruthy();
    expect(screen.queryByText(/Covered by/)).not.toBeInTheDocument();
  });
  it('merges several owning groups when a whole question part spans their shared evidence',()=>{
    const passages=[...evidenceForSection(congress,0),...evidenceForSection(congress,5)].filter(item=>item.kind==='paragraph').slice(0,2);
    render(<Story initial={{...blankBlock('story'),projectIds:[congress],answerPlan:{version:1,facets:[{kind:'contribution',status:'supported',evidenceIds:[passages[0].id]},{kind:'process',status:'supported',evidenceIds:[passages[1].id]},{kind:'outcomes',status:'supported',evidenceIds:passages.map(item=>item.id)}]}}}/>);
    const group=document.querySelector('[data-answer-facets="contribution process outcomes"]') as HTMLElement;
    expect(group).toBeTruthy();
    expect(within(group).getAllByRole('heading')).toHaveLength(1);
    for(const passage of passages)expect(screen.getAllByText(passage.text)).toHaveLength(1);
    expect(screen.queryByText(/Covered by/)).not.toBeInTheDocument();
  });
  it('keeps distinct question parts split when they contribute new evidence',()=>{
    const passages=[...evidenceForSection(congress,0),...evidenceForSection(congress,5)].filter(item=>item.kind==='paragraph').slice(0,3);
    render(<Story initial={{...blankBlock('story'),projectIds:[congress],answerPlan:{version:1,facets:[{kind:'process',status:'supported',evidenceIds:passages.slice(0,2).map(item=>item.id)},{kind:'outcomes',status:'supported',evidenceIds:passages.slice(1).map(item=>item.id)}]}}}/>);
    expect(screen.getByRole('heading',{name:'Approach'})).toBeVisible();
    expect(screen.getByRole('heading',{name:'Published outcomes'})).toBeVisible();
    for(const passage of passages)expect(screen.getAllByText(passage.text)).toHaveLength(1);
  });
  it('keeps every question part’s primary answer visible after merging and preserves requested source access',()=>{
    const passages=[...evidenceForSection(congress,0),...evidenceForSection(congress,5)].filter(item=>item.kind==='paragraph').slice(0,4);
    const source=evidenceForSection(congress,5).find(item=>item.kind==='link')!;
    render(<Story initial={{...blankBlock('story'),projectIds:[congress],answerPlan:{version:1,facets:[{kind:'process',status:'supported',evidenceIds:[...passages.slice(0,3).map(item=>item.id),source.id]},{kind:'outcomes',status:'supported',evidenceIds:[passages[2].id]},{kind:'sources',status:'supported',evidenceIds:[source.id]}]}}}/>);
    expect(screen.getByText(passages[2].text)).toBeVisible();
    expect(screen.getByRole('link',{name:source.text})).toBeVisible();
    expect(document.querySelector('[data-answer-facets="process outcomes sources"]')).toBeTruthy();
  });
  it('keeps longer supporting passages behind a disclosure',()=>{
    const passages=[...evidenceForSection(congress,0),...evidenceForSection(congress,5)].filter(item=>item.kind==='paragraph').slice(0,4);
    expect(passages.length).toBeGreaterThan(2);
    render(<Story initial={{...blankBlock('story'),projectIds:[congress],answerPlan:{version:1,facets:[{kind:'process',status:'supported',evidenceIds:passages.map(item=>item.id)}]}}}/>);
    expect(screen.getByText(passages[0].text)).toBeVisible();
    expect(screen.getByText(passages[2].text)).not.toBeVisible();
    fireEvent.click(screen.getByText('Read more supporting evidence'));
    expect(screen.getByText(passages[2].text)).toBeVisible();
  });
  it('answers a source facet with the actual requested artifact and a clear route to the rest of the evidence',()=>{
    const link=evidenceForSection(congress,5).find(item=>item.kind==='link')!;
    expect(link).toBeTruthy();
    render(<Story initial={{...blankBlock('story'),projectIds:[congress],focus:'evidence',layout:'project-evidence',answerPlan:{version:1,facets:[{kind:'sources',status:'supported',evidenceIds:[link.id]}]}}}/>);
    expect(screen.getByRole('link',{name:link.text})).toHaveAttribute('href',link.href);
    fireEvent.click(screen.getByText('Read in context'));
    fireEvent.click(screen.getByRole('button',{name:'Explore all published evidence'}));
    expect(screen.getByRole('searchbox',{name:'Find in this project'})).toBeVisible();
  });
  it('explains tied benchmark ranks and what absent evidence does not establish',()=>{
    render(<BenchmarkExplorer block={{...blankBlock('benchmark'),layout:'benchmark-compare',metric:'preparednessScore',states:['Arizona','Georgia']}} onChange={()=>{}}/>);
    expect(screen.getAllByText('· tied')).toHaveLength(2);
    fireEvent.click(screen.getByText('Evidence breakdown'));
    expect(screen.getByText(/does not establish that no activity occurred/)).toBeVisible();
    fireEvent.click(screen.getByText('About this benchmark'));
    expect(screen.getByText(/Equal underlying scores share a rank/)).toBeVisible();
  });
  it('announces filtered work results and allows recovery without rewriting the question',()=>{
    render(<Work/>);
    fireEvent.change(screen.getByRole('searchbox',{name:'Find a project'}),{target:{value:'unpublishednonexistenttopic'}});
    expect(screen.getByRole('status')).toHaveTextContent('0 projects matching your search.');
    fireEvent.click(screen.getByRole('button',{name:'Clear search'}));
    expect(screen.getByRole('searchbox',{name:'Find a project'})).toHaveValue('');
    expect(screen.getByRole('region',{name:'Work explorer'}).querySelectorAll('[data-project-id]')).toHaveLength(publicProjects.length);
  });
});
