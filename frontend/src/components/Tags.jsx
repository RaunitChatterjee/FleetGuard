const SEVERITY_META = {
  critical: { label: 'CRITICAL', color: 'var(--sev-critical)', glow: 'var(--sev-critical-glow)' },
  high: { label: 'HIGH', color: 'var(--sev-high)', glow: 'var(--sev-high-glow)' },
  medium: { label: 'MEDIUM', color: 'var(--sev-medium)', glow: 'var(--sev-medium-glow)' },
  low: { label: 'LOW', color: 'var(--sev-low)', glow: 'var(--sev-low-glow)' },
};

export function SeverityTag({ severity }) {
  const meta = SEVERITY_META[severity] || SEVERITY_META.low;
  return (
    <span
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: meta.color,
        background: meta.glow,
        border: `1px solid ${meta.color}33`,
        borderRadius: 'var(--radius-sm)',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: meta.color,
          boxShadow: severity === 'critical' ? `0 0 6px ${meta.color}` : 'none',
        }}
      />
      {meta.label}
    </span>
  );
}

export function AckTag({ acknowledged }) {
  if (acknowledged) {
    return (
      <span
        className="mono"
        style={{
          fontSize: 10.5,
          letterSpacing: '0.06em',
          color: 'var(--text-tertiary)',
          border: '1px solid var(--border-hairline)',
          padding: '3px 8px',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        ACKNOWLEDGED
      </span>
    );
  }
  return (
    <span
      className="mono"
      style={{
        fontSize: 10.5,
        letterSpacing: '0.06em',
        color: 'var(--amber)',
        border: '1px solid var(--amber-dim)',
        background: 'var(--amber-glow)',
        padding: '3px 8px',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      OPEN
    </span>
  );
}

export function DeviceStatusDot({ status, lastSeenStale }) {
  let color = 'var(--status-normal)';
  let label = 'Normal';
  if (lastSeenStale) {
    color = 'var(--status-offline)';
    label = 'Offline';
  } else if (status && status !== 'normal') {
    color = 'var(--status-warning)';
    label = status;
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 5px ${color}`,
        }}
      />
      <span style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>{label}</span>
    </span>
  );
}
