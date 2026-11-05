import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { photoRedirectCopy, type PhotoDestination } from '@/lib/photoRequest';

/** Local gallery destinations for a photography question. No model call. */
export default function PhotoRedirect({ destinations }: { destinations: PhotoDestination[] }) {
  return (
    <div className="home-entry" role="region" aria-label="Photographs">
      <p>{photoRedirectCopy(destinations)}</p>
      <div>
        {destinations.map(item => (
          <Link key={item.id} to={item.href}>
            {item.label}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
