import {useRef,useState} from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import ExperienceAutocomplete from '@/components/canvas/ExperienceAutocomplete';
function Harness({submit}:{submit:(text:string)=>void}){
 const [value,setValue]=useState('');const [open,setOpen]=useState(false);const ref=useRef<HTMLInputElement>(null);
 return <form onSubmit={e=>{e.preventDefault();submit(value);}}><ExperienceAutocomplete value={value} open={open} inputRef={ref} onChange={setValue} onSubmit={submit} onOpenChange={setOpen} onCompositionStart={()=>{}} onCompositionEnd={()=>{}}/></form>;
}
afterEach(cleanup);
describe('autocomplete interaction',()=>{
 it('keeps the draft intact, selects with arrows, and dismisses with Escape',()=>{
  const submit=vi.fn();render(<Harness submit={submit}/>);const input=screen.getByRole('combobox');
  fireEvent.focus(input);expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  fireEvent.keyDown(input,{key:'ArrowDown'});expect(screen.getByRole('listbox')).toBeInTheDocument();
  fireEvent.change(input,{target:{value:'taiw'}});fireEvent.keyDown(input,{key:'ArrowDown'});
  expect(input).toHaveValue('taiw');expect(input).toHaveAttribute('aria-activedescendant');
  fireEvent.keyDown(input,{key:'Enter'});expect(submit).toHaveBeenCalledWith('What did Isaac build in Taiwan?');
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'Escape'});
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();expect(input).toHaveValue('taiw');
 });
 it('supports pointer selection and does not select during IME composition',()=>{
  const submit=vi.fn();render(<Harness submit={submit}/>);const input=screen.getByRole('combobox');fireEvent.focus(input);fireEvent.keyDown(input,{key:'ArrowDown'});
  fireEvent.compositionStart(input);fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'Enter',isComposing:true});expect(submit).not.toHaveBeenCalled();
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();fireEvent.compositionEnd(input);
  fireEvent.click(screen.getByRole('option',{name:'Walk me through Isaac’s experience'}));
  expect(submit).toHaveBeenCalledWith('Walk me through Isaac’s experience');
 });
 it('closes on Tab or blur without replacing custom text',()=>{
  const submit=vi.fn();render(<Harness submit={submit}/>);const input=screen.getByRole('combobox');fireEvent.focus(input);fireEvent.change(input,{target:{value:'my own question'}});
  fireEvent.keyDown(input,{key:'Tab'});expect(screen.queryByRole('listbox')).not.toBeInTheDocument();expect(input).toHaveValue('my own question');expect(submit).not.toHaveBeenCalled();
  fireEvent.focus(input);fireEvent.blur(input);expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
 });
});
