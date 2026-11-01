import { afterEach, describe, expect, it, vi } from 'vitest';
import { scheduleImagePreloads } from '@/lib/imagePreload';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined }); });

describe('speculative image loading', () => {
  it('does not start speculative batches on a low-data connection', () => {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
    const images = vi.fn(); vi.stubGlobal('Image', images);
    const cancel = scheduleImagePreloads(['/low-data-a.jpg', '/low-data-b.jpg']);
    cancel(); expect(images).not.toHaveBeenCalled();
  });
  it('cancels queued batches when their route leaves', () => {
    vi.useFakeTimers(); vi.stubGlobal('requestIdleCallback', undefined);
    const images = vi.fn(function () { return {}; }); vi.stubGlobal('Image', images);
    const cancel = scheduleImagePreloads(['/cancel-a.jpg', '/cancel-b.jpg', '/cancel-c.jpg'], { batchSize: 1 });
    expect(images).toHaveBeenCalledTimes(1);
    cancel(); vi.runAllTimers(); expect(images).toHaveBeenCalledTimes(1);
  });
});
