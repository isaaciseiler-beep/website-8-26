import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MacintoshFrame from '@/components/canvas/MacintoshFrame';
import { macintoshSE, screenProjection } from '@/lib/macintoshModels';

afterEach(()=>{cleanup();vi.restoreAllMocks();});
beforeEach(()=>{
  const values=new Map<string,string>();
  Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)}});
});

describe('photographic Mac screens',()=>{
  it('matches the live screen to all four photographed glass corners',()=>{
    const device=macintoshSE;
    for(const frameWidth of [320,960]){
      const {width,height,matrix:m}=screenProjection(device,frameWidth);
      const corners=[[0,0],[width,0],[width,height],[0,height]];
      corners.forEach(([x,y],index)=>{
        const divisor=m[3]*x+m[7]*y+m[15];
        const actual=[(m[0]*x+m[4]*y+m[12])/divisor,(m[1]*x+m[5]*y+m[13])/divisor];
        const expected=device.screen[index].map((value,axis)=>(value-(axis===0?device.crop.x:device.crop.y))*frameWidth/device.crop.width);
        expect(actual[0]).toBeCloseTo(expected[0],5);expect(actual[1]).toBeCloseTo(expected[1],5);
      });
      expect(width/height).toBeCloseTo(device.display.width/device.display.height,6);
    }
  });
  it('uses the SE regardless of an old model preference, without a computer picker',()=>{
    window.localStorage.setItem('portfolio-macintosh-model','imac-g3');
    const {rerender}=render(<MacintoshFrame><input aria-label="Draft" defaultValue="Taiwan"/></MacintoshFrame>);
    const editor=screen.getByRole('textbox',{name:'Draft'});
    fireEvent.change(editor,{target:{value:'Compare Congress and Boehringer'}});
    rerender(<MacintoshFrame><input aria-label="Draft" defaultValue="Taiwan"/></MacintoshFrame>);
    expect(screen.getByRole('region',{name:'Macintosh SE screen'})).toContainElement(editor);
    expect(editor).toHaveValue('Compare Congress and Boehringer');
    expect(screen.queryByRole('combobox',{name:'Computer'})).not.toBeInTheDocument();
  });
});
