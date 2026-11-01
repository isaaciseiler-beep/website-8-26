import { describe, expect, it } from 'vitest';
import { isPhotographyRequest, resolveCanvasPlan } from '@/lib/genui';
import { initialPlan } from '@/lib/canvas';

describe('photography stays outside portfolio generation',()=>{
  it.each([
    'Show your photography projects',
    'Open the photography project in Taiwan',
    'Tell me about your photography career',
    'Tell me about your photography research',
    'Show images from the Taiwan teaching project',
    'Show me images of the Taiwan teaching project',
    'Show photos of the congressional report',
    'Open the photo gallery',
    'Show photojournalism projects',
    'Show pictures from Japan',
  ])('recognizes a photo request despite generic professional words: %s',text=>{
    expect(isPhotographyRequest(text)).toBe(true);
    expect(resolveCanvasPlan(text,initialPlan(),1).layout).toBe('photos');
  });
  it.each([
    'Show Taiwan photos and explain Isaac’s teaching work',
    'Photography and Isaac’s career',
    'Show your publications and photographs',
    'Explain your AI policy project alongside the photos',
    'How did Isaac use photography in the congressional work?',
    'Explain the photographs in the published congressional report',
    'What did Isaac contribute to journalism, including images?',
    'Show me Taiwan project outcomes with images',
    'Show Isaac’s congressional work with photos',
    'Show your publications with a few photographs',
  ])('preserves an actual work or publication question alongside photography: %s',text=>{
    expect(isPhotographyRequest(text)).toBe(false);
  });
  it('does not confuse non-photographic technical terms with a gallery request',()=>{
    expect(isPhotographyRequest('Explain photovoltaic research')).toBe(false);
  });
});
