import { useEffect, useState } from 'react';

export default function RouteLoader({ overlay = false }: { overlay?: boolean }) {
  const [delayed, setDelayed] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setDelayed(true), 650); return () => clearTimeout(timer); }, []);
  return <div className={`screen-loader${overlay ? ' screen-loader--overlay' : ''}`} role="status" aria-label="Loading" aria-busy="true">
    <span className={delayed ? 'screen-loader-label' : 'sr-only'}>Loading…</span>
  </div>;
}
