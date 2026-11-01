import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isLowDataConnection } from '@/lib/imagePreload';

type PrioritizedImage = HTMLImageElement & { fetchPriority?: 'high' | 'auto' };

/** One viewport policy; offscreen images keep native lazy loading. */
export default function ImagePreloader() {
  const location = useLocation();
  useLayoutEffect(() => {
    const seen = new WeakSet<HTMLImageElement>();
    const cleanup: (() => void)[] = [];
    let frame = 0;
    let priority = 0;
    const prepare = (image: HTMLImageElement) => {
      if (seen.has(image) || !image.src) return;
      seen.add(image);
      const animated = Boolean(image.style.opacity) || image.dataset.motionImage === 'true';
      const ready = () => {
        if (image.naturalWidth === 0) { image.dataset.imageState = 'error'; return; }
        if (!animated && image.dataset.imageState === 'loading') image.dataset.imageReveal = 'true';
        image.dataset.imageState = 'ready';
      };
      image.dataset.imageState = image.complete && image.naturalWidth ? 'ready' : 'loading';
      image.addEventListener('load', ready);
      image.addEventListener('error', ready);
      cleanup.push(() => { image.removeEventListener('load', ready); image.removeEventListener('error', ready); });
      if (image.complete) ready();
      if (image.style.opacity === '0') return;
      observer?.observe(image);
    };
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const image = entry.target as PrioritizedImage;
        image.fetchPriority = priority++ < 2 ? 'high' : 'auto';
        image.loading = 'eager';
        observer?.unobserve(image);
      });
    }, { rootMargin: isLowDataConnection() ? '0px' : '400px 0px' });
    const scan = () => { frame = 0; document.querySelectorAll<HTMLImageElement>('img[src]').forEach(prepare); };
    scan();
    const mutations = new MutationObserver(() => { if (!frame) frame = requestAnimationFrame(scan); });
    mutations.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true });
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); mutations.disconnect(); cleanup.forEach(dispose => dispose()); };
  }, [location.key]);
  return null;
}
