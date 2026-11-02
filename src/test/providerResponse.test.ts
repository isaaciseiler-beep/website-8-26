import { describe, expect, it, vi } from 'vitest';
import { providerStream, readProviderJson, waitForProvider } from '../../server/provider-response';

describe('bounded upstream responses', () => {
  it('reads JSON split across byte and multi-byte character boundaries', async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ text: 'Taiwan 台灣' }));
    const response = new Response(new ReadableStream({ start(controller) {
      for (let i = 0; i < bytes.length; i += 2) controller.enqueue(bytes.slice(i, i + 2));
      controller.close();
    } }));
    expect(await readProviderJson(response, new AbortController().signal)).toEqual({ text: 'Taiwan 台灣' });
  });

  it('bounds bytes while reading even when the upstream omits or understates content-length', async () => {
    const cancel = vi.fn();
    const response = new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new TextEncoder().encode('界'.repeat(30)));
    }, cancel }), { headers: { 'content-length': '1' } });
    await expect(readProviderJson(response, new AbortController().signal, 64)).rejects.toThrow('response too large');
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('rejects a declared oversized body before reading it', async () => {
    const cancel = vi.fn();
    const response = new Response(new ReadableStream({ cancel }), { headers: { 'content-length': '64001' } });
    await expect(readProviderJson(response, new AbortController().signal)).rejects.toThrow('response too large');
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('does not expose a malformed upstream body in its error', async () => {
    const response = new Response('private upstream response that is not JSON');
    await expect(readProviderJson(response, new AbortController().signal)).rejects.toThrow('Invalid provider output: malformed JSON');
  });

  it('cancels an unresponsive body reader promptly', async () => {
    const abort = new AbortController();
    const cancel = vi.fn();
    const response = new Response(new ReadableStream({ cancel }));
    const pending = readProviderJson(response, abort.signal);
    abort.abort(Object.assign(new Error('Deadline exceeded'), { name: 'TimeoutError' }));
    await expect(pending).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('consumes a late adapter rejection after cancellation without committing it', async () => {
    const abort = new AbortController();
    let reject!: (error: Error) => void;
    const pending = waitForProvider(new Promise((_resolve, fail) => { reject = fail; }), abort.signal);
    abort.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    reject(new Error('Late failure'));
    await Promise.resolve();
  });

  it('does not wait on an adapter when already canceled', async () => {
    const abort = new AbortController(); abort.abort();
    await expect(waitForProvider(new Promise(() => {}), abort.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('stops waiting for a stalled chunk iterator and releases it without awaiting broken cleanup', async () => {
    const abort = new AbortController();
    const close = vi.fn(() => new Promise<IteratorResult<string>>(() => {}));
    const iterable = { [Symbol.asyncIterator]: () => ({ next: () => new Promise<IteratorResult<string>>(() => {}), return: close }) };
    const consume = async () => { for await (const _chunk of providerStream(iterable, abort.signal)) { /* Never receives a chunk. */ } };
    const pending = consume();
    abort.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(close).toHaveBeenCalledOnce();
  });
});
