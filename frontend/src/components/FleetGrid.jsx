import { useMemo, useState } from 'react';
import { EmptyView, LoadingView } from './StateViews';

const PAD = 0.08;

function projectPositions(entries) {
  const withCoords = entries.filter(([, pos]) => pos);
  if (withCoords.length === 0) return [];

  const lats = withCoords.map(([, p]) => p.latitude);
  const lons = withCoords.map(([, p]) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latSpan = maxLat - minLat || 0.01;
  const lonSpan = maxLon - minLon || 0.01;

  return withCoords.map(([deviceId, pos]) => {
    const nx = (pos.longitude - minLon) / lonSpan;
    const ny = (pos.latitude - minLat) / latSpan;
    const x = PAD + nx * (1 - 2 * PAD);
    const y = 1 - (PAD + ny * (1 - 2 * PAD)); // invert: north = up
    return { deviceId, x, y, pos };
  });
}

export function FleetGrid({ devices, positions, loading, alertsByDevice, onSelectDevice, selectedDeviceId }) {
  const [hovered, setHovered] = useState(null);

  const entries = useMemo(
    () => (devices || []).map((d) => [d.device_id, positions[d.device_id]]),
    [devices, positions]
  );
  const points = useMemo(() => projectPositions(entries), [entries]);
  const unpositionedCount = entries.length - points.length;

  if (loading) return <LoadingView label="Acquiring fleet telemetry…" />;
  if (points.length === 0) {
    return (
      <EmptyView
        label="No live fleet telemetry"
        hint="Devices appear here once they report GPS telemetry via /api/telemetry/ingest."
      />
    );
  }

  const W = 100;
  const H = 62;
  const gridLines = 8;
  const hoveredPoint = hovered ? points.find((p) => p.deviceId === hovered) : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 260, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          width="100%"
          height="100%"
          style={{ display: 'block' }}
        >
          <defs>
            <radialGradient id="fg-scan" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width={W} height={H} fill="url(#fg-scan)" />
          {Array.from({ length: gridLines + 1 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={(i / gridLines) * W}
              y1={0}
              x2={(i / gridLines) * W}
              y2={H}
              stroke="var(--border-hairline)"
              strokeWidth="0.15"
            />
          ))}
          {Array.from({ length: 5 + 1 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={(i / 5) * H}
              x2={W}
              y2={(i / 5) * H}
              stroke="var(--border-hairline)"
              strokeWidth="0.15"
            />
          ))}

          {points.map(({ deviceId, x, y }) => {
            const alerts = alertsByDevice[deviceId] || [];
            const openCritical = alerts.some((a) => a.severity === 'critical' && !a.acknowledged);
            const openAny = alerts.some((a) => !a.acknowledged);
            const color = openCritical ? 'var(--sev-critical)' : openAny ? 'var(--amber)' : 'var(--status-normal)';
            const isSelected = selectedDeviceId === deviceId;
            const cx = x * W;
            const cy = y * H;

            return (
              <g
                key={deviceId}
                transform={`translate(${cx}, ${cy})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(deviceId)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectDevice?.(deviceId)}
              >
                {/* Larger invisible hit area so hover/click isn't limited to the tiny dot */}
                <circle r={4.5} fill="transparent" />
                {openAny && (
                  <circle r={isSelected ? 3.2 : 2.6} fill="none" stroke={color} strokeWidth="0.3" opacity="0.6">
                    <animate attributeName="r" values="1.8;4.2;1.8" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  r={hovered === deviceId || isSelected ? 1.9 : 1.3}
                  fill={color}
                  stroke="var(--bg-surface)"
                  strokeWidth="0.3"
                  style={{ transition: 'r 0.1s var(--ease-console)' }}
                />
                <text
                  x="0"
                  y="-2.6"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="2.1"
                  fill={hovered === deviceId || isSelected ? 'var(--text-primary)' : 'var(--text-tertiary)'}
                >
                  {deviceId}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredPoint && (
          <TelemetryTooltip point={hoveredPoint} alertsByDevice={alertsByDevice} />
        )}
      </div>

      <FleetGridLegend unpositionedCount={unpositionedCount} />
    </div>
  );
}

function TelemetryTooltip({ point, alertsByDevice }) {
  const { deviceId, x, y, pos } = point;
  const alerts = alertsByDevice[deviceId] || [];
  const openCount = alerts.filter((a) => !a.acknowledged).length;
  const ts = new Date(pos.timestamp.endsWith('Z') ? pos.timestamp : `${pos.timestamp}Z`);
  const secondsAgo = Math.max(0, Math.floor((Date.now() - ts.getTime()) / 1000));
  const lastSeen = secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`;

  // Clamp tooltip position so it doesn't spill outside the panel near edges.
  const left = `clamp(4px, ${x * 100}%, calc(100% - 168px))`;
  const top = `clamp(4px, calc(${y * 100}% + 14px), calc(100% - 96px))`;

  return (
    <div
      className="mono"
      style={{
        position: 'absolute',
        left,
        top,
        width: 160,
        background: 'var(--bg-surface-raised)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 10px',
        fontSize: 11,
        color: 'var(--text-secondary)',
        pointerEvents: 'none',
        zIndex: 2,
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>{deviceId}</div>
      <div>Speed: {pos.speed_kmh.toFixed(1)} km/h</div>
      <div>Ignition: {pos.ignition_status}</div>
      <div>Last seen: {lastSeen}</div>
      {openCount > 0 && (
        <div style={{ color: 'var(--amber)', marginTop: 3 }}>{openCount} open alert{openCount > 1 ? 's' : ''}</div>
      )}
    </div>
  );
}

function FleetGridLegend({ unpositionedCount }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        padding: '8px 10px 2px',
        borderTop: '1px solid var(--border-hairline)',
        marginTop: 8,
      }}
    >
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <LegendItem color="var(--status-normal)" label="Normal" />
        <LegendItem color="var(--amber)" label="Open alert" />
        <LegendItem color="var(--sev-critical)" label="Critical alert" />
      </div>
      {unpositionedCount > 0 && (
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
          {unpositionedCount} device(s) awaiting first telemetry
        </span>
      )}
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}` }} />
      {label}
    </span>
  );
}
