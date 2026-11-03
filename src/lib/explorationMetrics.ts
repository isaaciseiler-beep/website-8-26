export type ExplorationMetric = {
  requestId: number;
  kind: 'question' | 'refinement';
  firstContentCommittedMs?: number;
  requestCompletedMs?: number;
  result?: 'authored' | 'generated' | 'unavailable' | 'guidance' | 'cancelled';
};
const recent: ExplorationMetric[] = [];
let sequence = 0;

/** Bounded memory-only timings. No question, evidence, URL or identity is kept
 * or transmitted. A committed DOM result is not a claim about first paint. */
export function beginExplorationMetric(kind: ExplorationMetric['kind']) {
  const started = performance.now();
  const metric: ExplorationMetric = { requestId: ++sequence, kind };
  recent.push(metric);
  if (recent.length > 24) recent.shift();
  const elapsed = () => Math.max(0, Math.round(performance.now() - started));
  return {
    contentCommitted() { metric.firstContentCommittedMs ??= elapsed(); },
    finish(result: NonNullable<ExplorationMetric['result']>) {
      if (metric.result) return;
      metric.requestCompletedMs = elapsed();
      metric.result = result;
    },
  };
}
export function recentExplorationMetrics(): ExplorationMetric[] { return recent.map(metric => ({ ...metric })); }
