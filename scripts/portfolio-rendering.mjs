import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Window } from 'happy-dom';

/** Use the real components, not catalog prose, to test what a visitor receives
 * before touching a control. Closed disclosure contents and hidden regions do
 * not count as answered evidence. This is structural visibility, not browser QA. */
export function renderedAnswer(components,composition) {
  const html=renderToStaticMarkup(createElement('main',null,...composition.blocks.map((block,index)=>{
    const Component=block.kind==='story'?components.ProjectStory:block.kind==='comparison'?components.ProjectComparison:block.kind==='timeline'?components.CareerExplorer:null;
    return Component?createElement(Component,{key:index,block,onChange:()=>{}}):null;
  })));
  const window=new Window();
  try {
    window.document.body.innerHTML=html;
    const root=window.document.body;
    root.querySelectorAll('[hidden],[aria-hidden="true"],[inert],script,style,svg').forEach(node=>node.remove());
    root.querySelectorAll('details:not([open])').forEach(node=>{for(const child of [...node.children])if(child.tagName!=='SUMMARY')child.remove();});
    // Controls may name an answer that has not actually been opened yet. Their
    // labels must never satisfy required answer prose or source-access targets.
    root.querySelectorAll('button,select,input,textarea,nav').forEach(node=>node.remove());
    root.querySelectorAll('p,h1,h2,h3,h4,li,dt,dd,blockquote,a,summary').forEach(node=>node.appendChild(window.document.createTextNode(' ')));
    return {text:root.textContent??'',linkCount:root.querySelectorAll('a[href]').length};
  } finally { window.happyDOM.abort(); }
}
