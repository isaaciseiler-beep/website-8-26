import type { ProjectItem, ProjectSection } from '@/lib/siteContent';

export type ProjectVisualSource = { src: string; alt: string; presentation: 'photograph'|'artifact'; note?: string };
export type ProjectVisualSelection = ProjectVisualSource & { fallbacks: ProjectVisualSource[] };
function visual(src:string,alt:string):ProjectVisualSource {
  return {src,alt,presentation:/cover artwork|product flow|screenshot|contributed chats?|interface|diagram|slide|newsletter|website|campaign (?:artwork|creative)|ChatGPT (?:Pulse|Atlas)|Introducing.*(?:Atlas|group chats)/i.test(alt)?'artifact':'photograph'};
}
function sectionVisual(section:ProjectSection|undefined,project:ProjectItem):ProjectVisualSelection|undefined {
  for(const media of section?.media??[]){
    const primary=media.type==='image'&&media.src?visual(media.src,media.alt??media.caption??media.title??project.title)
      :media.images?.length?visual(media.images[0].src,media.images[0].alt)
      :media.poster?visual(media.poster,media.title??media.alt??project.title):undefined;
    if(!primary)continue;
    const alternates:ProjectVisualSource[]=[];
    if(media.fallbackPoster)alternates.push({...visual(media.fallbackPoster,`${media.title??project.title} — video poster`),note:'Video poster'});
    media.images?.slice(1).forEach(image=>alternates.push({...visual(image.src,image.alt),note:'Alternate published image'}));
    alternates.push({...visual(project.image,`Project cover for ${project.title}`),note:'Project cover'});
    return {...primary,fallbacks:[...new Map(alternates.filter(source=>source.src!==primary.src).map(source=>[source.src,source])).values()]};
  }
}
/** Prefer the selected section's authored image, retaining its reviewed poster
 * alternative before the known local project cover. Never invent asset URLs. */
export function representativeProjectImage(project:ProjectItem,sectionIndex?:number):ProjectVisualSelection {
  const requested=sectionIndex===undefined?undefined:sectionVisual(project.sections[sectionIndex],project);
  return requested??project.sections.map(section=>sectionVisual(section,project)).find(Boolean)??{...visual(project.image,project.title),fallbacks:[]};
}
