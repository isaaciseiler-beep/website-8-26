import { skeletonKind } from '@/lib/exploreProgress';

/** A still placeholder with the same block rhythm as the answer that will replace it. */
export default function AnswerSkeleton({ layout, title }: { layout: string; title?: string }) {
  const kind = skeletonKind(layout);
  const titleBar = title ? <p className="home-skeleton-question">{title}</p> : (kind === 'list' || kind === 'lines') ? null : <span className="home-skeleton-title" />;
  return (
    <div className={`home-skeleton is-${kind}`} aria-hidden="true" data-skeleton={kind}>
      {titleBar}
      {kind === 'split' ? (
        <span className="home-skeleton-split"><i /><i /></span>
      ) : kind === 'rows' ? (
        <><span /><span /><span /><span className="is-short" /></>
      ) : kind === 'list' || kind === 'lines' ? (
        <><span /><span /><span className="is-short" /></>
      ) : (
        <><span /><span className="is-short" /><span className="home-skeleton-figure" /></>
      )}
    </div>
  );
}
