/** Bound all waits even when an upstream adapter does not observe cancellation.
 * Late resolutions/rejections are consumed, never committed after cancellation. */
export function waitForProvider<T>(pending: PromiseLike<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const stop = () => { cleanup(); reject(signal.reason ?? Object.assign(new Error('Request aborted'), { name: 'AbortError' })); };
    const cleanup = () => signal.removeEventListener('abort', stop);
    if (signal.aborted) {
      // Attach handlers even when already aborted: pending may reject later.
      Promise.resolve(pending).catch(() => {});
      stop();
      return;
    }
    signal.addEventListener('abort', stop, { once: true });
    Promise.resolve(pending).then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
  });
}

/** A transport may ignore its abort signal while awaiting the next chunk. */
export async function* providerStream<T>(stream: AsyncIterable<T>, signal: AbortSignal): AsyncGenerator<T> {
  const iterator = stream[Symbol.asyncIterator]();
  let complete = false;
  try {
    for (;;) {
      const next = await waitForProvider(iterator.next(), signal);
      if (next.done) { complete = true; return; }
      yield next.value;
    }
  } finally {
    if (!complete) {
      try { void Promise.resolve(iterator.return?.()).catch(() => {}); }
      catch { /* Preserve the original cancellation/provider failure. */ }
    }
  }
}

/** Check byte limits while reading, before allocating/parsing an unbounded body.
 * No provider response body is included in errors or visitor-facing diagnostics. */
export async function readProviderJson(response: Response, signal: AbortSignal, maxBytes = 64_000): Promise<unknown> {
  if (signal.aborted) { void response.body?.cancel().catch(() => {}); signal.throwIfAborted(); }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Invalid provider output: empty body');
  try {
    const declared = response.headers.get('content-length');
    if (declared && /^\d+$/.test(declared) && Number(declared) > maxBytes) throw new Error('Invalid provider output: response too large');
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    for (;;) {
      const { done, value } = await waitForProvider(reader.read(), signal);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error('Invalid provider output: response too large');
      chunks.push(value);
    }
    signal.throwIfAborted();
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new Error('Invalid provider output: malformed JSON'); }
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}
