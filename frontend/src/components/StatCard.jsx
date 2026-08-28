export function StatCard({ label, value, accent = 'neutral', icon: Icon, sublabel }) {
  const accentColor =
    accent === 'critical'
      ? 'var(--sev-critical)'
      : accent === 'amber'
      ? 'var(--amber)'
      : 'var(--text-secondary)';

  return (
    <div
      className="chamfer"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-hairline)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: accentColor,
          opacity: accent === 'neutral' ? 0.25 : 0.8,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="eyebrow">{label}</span>
        {Icon && <Icon size={14} color={accentColor} strokeWidth={2} />}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 30,
          fontWeight: 600,
          color: accent === 'neutral' ? 'var(--text-primary)' : accentColor,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sublabel && (
        <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{sublabel}</span>
      )}
    </div>
  );
}
