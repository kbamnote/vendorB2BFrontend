export default function StatCard({ label, value, meta, icon: Icon, tone = '' }) {
  return (
    <div className="stat">
      {Icon && (
        <div className={`stat-icon ${tone}`.trim()}>
          <Icon size={19} />
        </div>
      )}
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {meta && <div className="stat-meta">{meta}</div>}
    </div>
  );
}
