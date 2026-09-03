export function Spinner({ size = 'md' }) {
  return <span className={`spinner ${size === 'lg' ? 'lg' : ''}`} aria-label="Loading" />;
}

export function LoadingBlock({ label = 'Loading...' }) {
  return (
    <div className="loading-block col gap-12 center">
      <span className="spinner lg" />
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

export function FullPageLoader({ label = 'Preparing your workspace' }) {
  return (
    <div className="center col gap-16" style={{ minHeight: '100vh' }}>
      <span className="spinner lg" />
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

export default Spinner;
