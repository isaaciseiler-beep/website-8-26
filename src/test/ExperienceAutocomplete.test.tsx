import {useRef,useState} from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import ExperienceAutocomplete from '@/components/canvas/ExperienceAutocomplete';
function Harness({submit}:{submit:(text:string)=>void}){
 const [value,setValue]=useState('');const [open,setOpen]=useState(false);const ref=useRef<HTMLTextAreaElement>(null);
 return <form onSubmit={e=>{e.preventDefault();submit(value);}}><ExperienceAutocomplete value={value} open={open} inputRef={ref} onChange={setValue} onSubmit={submit} onOpenChange={setOpen} onCompositionStart={()=>{}} onCompositionEnd={()=>{}}/></form>;
}
afterEach(()=>{cleanup();vi.restoreAllMocks();});
describe('autocomplete interaction',()=>{
 it('keeps the draft intact, selects with arrows, and dismisses with Escape',()=>{
  const submit=vi.fn();render(<Harness submit={submit}/>);const input=screen.getByRole('textbox');
  fireEvent.focus(input);expect(screen.getByRole('listbox')).toBeInTheDocument();expect(submit).not.toHaveBeenCalled();expect(input).toHaveValue('');
  fireEvent.keyDown(input,{key:'ArrowDown'});expect(screen.getByRole('listbox')).toBeInTheDocument();
  fireEvent.change(input,{target:{value:'taiw'}});fireEvent.keyDown(input,{key:'ArrowDown'});
  expect(input).toHaveValue('taiw');expect(input).toHaveAttribute('aria-activedescendant');
  expect(document.getElementById(input.getAttribute('aria-controls')!)).toBe(screen.getByRole('listbox'));
  expect(document.getElementById(input.getAttribute('aria-activedescendant')!)).toHaveAttribute('aria-selected','true');
  expect(screen.getByRole('listbox').querySelector('li[role=group]')).toBeNull();
  fireEvent.keyDown(input,{key:'Enter'});expect(submit).toHaveBeenCalledWith('How did Isaac help teachers in Taiwan?');
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'Escape'});
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();expect(input).toHaveValue('taiw');
 });
 it('supports pointer selection and does not select during IME composition',()=>{
  const submit=vi.fn();render(<Harness submit={submit}/>);const input=screen.getByRole('textbox');fireEvent.focus(input);fireEvent.keyDown(input,{key:'ArrowDown'});
  fireEvent.compositionStart(input);fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'Enter',isComposing:true});expect(submit).not.toHaveBeenCalled();
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();fireEvent.compositionEnd(input);
  fireEvent.click(screen.getByRole('option',{name:'Who is Isaac?'}));
  expect(submit).toHaveBeenCalledWith('Who is Isaac?');
 });
 it('commits a custom wrapped question on Enter without inserting a newline',()=>{
  const submit=vi.fn();render(<Harness submit={submit}/>);const input=screen.getByRole('textbox');
  fireEvent.change(input,{target:{value:'How did Isaac turn participant feedback into changes in Taiwan?'}});
  fireEvent.keyDown(input,{key:'Escape'});
  fireEvent.keyDown(input,{key:'Enter'});
  expect(submit).toHaveBeenCalledOnce();
  expect(submit).toHaveBeenCalledWith('How did Isaac turn participant feedback into changes in Taiwan?');
  expect(input).toHaveValue('How did Isaac turn participant feedback into changes in Taiwan?');
 });
 it('closes on Tab or blur without replacing custom text',()=>{
  const submit=vi.fn();render(<Harness submit={submit}/>);const input=screen.getByRole('textbox');fireEvent.focus(input);fireEvent.change(input,{target:{value:'my own question'}});
  fireEvent.keyDown(input,{key:'Tab'});expect(screen.queryByRole('listbox')).not.toBeInTheDocument();expect(input).toHaveValue('my own question');expect(submit).not.toHaveBeenCalled();
  fireEvent.focus(input);fireEvent.blur(input);expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
 });
});

it('keeps a hovered suggestion from replacing the question submitted with Enter',()=>{
  const submit=vi.fn();render(<Harness submit={submit}/>);const input=screen.getByRole('textbox');
  fireEvent.change(input,{target:{value:'taiwan'}});
  fireEvent.pointerMove(screen.getAllByRole('option')[1]);
  expect(input).not.toHaveAttribute('aria-activedescendant');
  fireEvent.keyDown(input,{key:'Enter'});
  expect(submit).toHaveBeenCalledWith('taiwan');
});

it('reaches both shortcuts with arrows and recovers when composition ends by blur',()=>{
  const submit=vi.fn();render(<Harness submit={submit}/>);const input=screen.getByRole('textbox');
  fireEvent.focus(input);
  for(let index=0;index<5;index++)fireEvent.keyDown(input,{key:'ArrowDown'});
  expect(screen.getByRole('option',{name:'How to explore'})).toHaveAttribute('aria-selected','true');
  fireEvent.keyDown(input,{key:'Enter'});expect(submit).toHaveBeenLastCalledWith('How to explore');
  fireEvent.focus(input);
  fireEvent.compositionStart(input);fireEvent.blur(input);fireEvent.focus(input);
  fireEvent.keyDown(input,{key:'ArrowUp'});
  expect(screen.getByRole('option',{name:'Browse work'})).toHaveAttribute('aria-selected','true');
  fireEvent.keyDown(input,{key:'Enter'});expect(submit).toHaveBeenLastCalledWith('Explore all projects');
});


it('reveals a selected suggestion inside the CRT even when it already fits its own list',()=>{
  const submit=vi.fn();render(<div data-exploration-scroll><Harness submit={submit}/></div>);
  const input=screen.getByRole('textbox');fireEvent.focus(input);
  const viewport=document.querySelector<HTMLElement>('[data-exploration-scroll]')!;
  const list=screen.getByRole('listbox');
  const row=screen.getAllByRole('option')[0];
  vi.spyOn(viewport,'getBoundingClientRect').mockReturnValue({top:200,bottom:500} as DOMRect);
  vi.spyOn(list,'getBoundingClientRect').mockReturnValue({top:450,bottom:600} as DOMRect);
  vi.spyOn(row,'getBoundingClientRect').mockReturnValue({top:510,bottom:554} as DOMRect);
  viewport.scrollTop=100;
  const localScroll=vi.spyOn(viewport,'scrollTo');
  const pageScroll=vi.spyOn(window,'scrollTo');
  fireEvent.keyDown(input,{key:'ArrowDown'});
  expect(localScroll).toHaveBeenCalledWith({top:154,behavior:'instant'});
  expect(pageScroll).not.toHaveBeenCalled();
  expect(input).toHaveValue('');
  expect(submit).not.toHaveBeenCalled();
});
