const RouteLoader = ({ overlay = false }: { overlay?: boolean }) => (
  <div className={`screen-loader${overlay ? ' screen-loader--overlay' : ''}`} role="status" aria-label="Loading" aria-busy="true">
    <span className="sr-only">Loading</span>
  </div>
);
export default RouteLoader;
