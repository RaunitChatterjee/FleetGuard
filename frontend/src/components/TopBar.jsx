import { ShieldAlert } from 'lucide-react';

// Generates a jagged waveform path — calmer when the fleet is clean,
// spikier when there are unacknowledged / critical alerts. This is a
// decorative encoding of real state (not a literal data chart).
function buildWavePath(seed, intensity) {
  const points = [];
  const width = 640;
  const midY = 24;
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const noise = Math.sin(i * 0.7 + seed) * 2 + Math.sin(i * 1.9 + seed * 1.3) * 1.2;
    const spike = i % 11 === 0 ? intensity * (Math.sin(seed + i) > 0 ? 1 : -1) : 0;
    const y = midY + noise + spike;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M0,${midY} L${points.join(' L')}`;
}

export function TopBar({ criticalCount = 0, unacknowledgedCount = 0, connected }) {
  const intensity = criticalCount > 0 ? 16 : unacknowledgedCount > 0 ? 8 : 2;
  const waveColor = criticalCount > 0 ? 'var(--sev-critical)' : 'var(--amber)';
  const path1 = buildWavePath(1.3, intensity);
  const path2 = buildWavePath(4.1, intensity * 0.7);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        borderBottom: '1px solid var(--border-hairline)',
        background: 'var(--bg-base)',
        gap: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div
          className="chamfer"
          style={{
            width: 34,
            height: 34,
            background: 'var(--bg-surface-raised)',
            border: '1px solid var(--border-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldAlert size={17} color="var(--amber)" strokeWidth={2.2} />
        </div>
        <div>
          <h1 style={{ fontSize: 17, letterSpacing: '0.03em', color: 'var(--text-primary)' }}>
            FLEETGUARD
          </h1>
          <div className="eyebrow" style={{ marginTop: 1 }}>
            Fleet Telematics Security Console
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          maxWidth: 480,
          height: 34,
          display: 'flex',
          alignItems: 'center',
          opacity: 0.9,
        }}
      >
        <svg viewBox="0 0 640 48" width="100%" height="100%" preserveAspectRatio="none">
          <path d={path2} fill="none" stroke="var(--border-strong)" strokeWidth="1.2" />
          <path d={path1} fill="none" stroke={waveColor} strokeWidth="1.6">
            <animate
              attributeName="opacity"
              values="0.55;1;0.55"
              dur={criticalCount > 0 ? '1.1s' : '2.4s'}
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right' }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            {unacknowledgedCount} unacknowledged
          </div>
        </div>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: connected ? 'var(--status-normal)' : 'var(--sev-critical)',
            border: `1px solid ${connected ? 'var(--status-normal)' : 'var(--sev-critical)'}44`,
            padding: '5px 10px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: connected ? 'var(--status-normal)' : 'var(--sev-critical)',
              boxShadow: `0 0 6px ${connected ? 'var(--status-normal)' : 'var(--sev-critical)'}`,
            }}
          />
          {connected ? 'LINK ACTIVE' : 'LINK DOWN'}
        </span>
      </div>
    </header>
  );
}
