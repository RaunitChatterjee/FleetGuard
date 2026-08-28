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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 260 }}>
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
              {openAny && (
                <circle r={isSelected ? 3.2 : 2.6} fill="none" stroke={color} strokeWidth="0.3" opacity="0.6">
                  <animate attributeName="r" values="1.8;4.2;1.8" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r={isSelected ? 1.7 : 1.3} fill={color} stroke="var(--bg-surface)" strokeWidth="0.3" />
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
      {unpositionedCount > 0 && (
        <span
          className="mono"
          style={{
            position: 'absolute',
            bottom: 8,
            right: 10,
            fontSize: 10.5,
            color: 'var(--text-tertiary)',
          }}
        >
          {unpositionedCount} device(s) awaiting first telemetry
        </span>
      )}
    </div>
  );
}
