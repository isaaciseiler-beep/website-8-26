import { skeletonKind } from '@/lib/exploreProgress';

/** A still placeholder with the same block rhythm as the answer that will replace it. */
export default function AnswerSkeleton({ layout }: { layout: string }) {
  const kind = skeletonKind(layout);
  return (
    <div className={`home-skeleton is-${kind}`} aria-hidden="true" data-skeleton={kind}>
      {kind === 'split' ? (
        <>
          <span className="home-skeleton-title" />
          <span className="home-skeleton-split"><i /><i /></span>
        </>
      ) : kind === 'rows' ? (
        <>
          <span className="home-skeleton-title" />
          <span /><span /><span /><span className="is-short" />
        </>
      ) : kind === 'list' ? (
        <>
          <span /><span /><span className="is-short" />
        </>
      ) : kind === 'lines' ? (
        <>
          <span /><span /><span className="is-short" />
        </>
      ) : (
        <>
          <span className="home-skeleton-title" />
          <span /><span className="is-short" />
          <span className="home-skeleton-figure" />
        </>
      )}
    </div>
  );
}
