import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import PhotoPreview from '@/components/PhotoPreview';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('updates mounted consumers when reduced motion changes and removes its listener', () => {
  let matches = false;
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', () => ({ get matches() { return matches; },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }));
  function Consumer() { return <span>{useMotionPreference() ? 'static' : 'animated'}</span>; }
  const view = render(<Consumer />);
  expect(screen.getByText('animated')).toBeInTheDocument();
  act(() => { matches = true; listeners.forEach(fn => fn()); });
  expect(screen.getByText('static')).toBeInTheDocument();
  view.unmount();
  expect(listeners.size).toBe(0);
});

describe('decode-aware photo navigation', () => {
  it('holds the old image and ignores a superseded image load', async () => {
    const images: {src: string; onload: null | (() => Promise<void>); onerror: null | (() => void)}[] = [];
    class ControlledImage {
      src = ''; onload = null; onerror = null; decode = () => Promise.resolve();
      constructor() { images.push(this); }
    }
    vi.stubGlobal('Image', ControlledImage);
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    const props = {images: ['/one.jpg', '/two.jpg', '/three.jpg'], onClose: vi.fn(), onNavigate: vi.fn()};
    const view = render(<PhotoPreview {...props} currentIndex={0} />);
    await act(async () => { await images.find(image => image.src === '/one.jpg')!.onload!(); });
    expect(document.querySelector('.photo-preview-image')).toHaveAttribute('src', '/one.jpg');
    view.rerender(<PhotoPreview {...props} currentIndex={1} />);
    expect(document.querySelector('.photo-preview-image')).toHaveAttribute('src', '/one.jpg');
    const second = images.filter(image => image.src === '/two.jpg').slice(-1)[0]!;
    const staleLoad = second.onload!;
    view.rerender(<PhotoPreview {...props} currentIndex={2} />);
    await act(async () => { await staleLoad(); });
    expect(document.querySelector('.photo-preview-image')).toHaveAttribute('src', '/one.jpg');
    await act(async () => { await images.filter(image => image.src === '/three.jpg').slice(-1)[0]!.onload!(); });
    expect(document.querySelector('.photo-preview-image')).toHaveAttribute('src', '/three.jpg');
  });
});
