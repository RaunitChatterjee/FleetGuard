import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyView, LoadingView } from './StateViews';
import { AlertsTable } from './AlertsTable';

function resolveVar(cssVar) {
  if (typeof window === 'undefined') return '#f5a623';
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar.replace('var(', '').replace(')', '')).trim() || '#f5a623';
}

export function DeviceDetail({ deviceId, telemetry, loading, deviceAlerts, onAcknowledge }) {
  const chartData = useMemo(() => {
    if (!telemetry) return [];
    return [...telemetry]
      .reverse()
      .map((t) => ({
        time: new Date(t.timestamp.endsWith('Z') ? t.timestamp : `${t.timestamp}Z`).toLocaleTimeString(undefined, {
          hour12: false,
        }),
        speed: t.speed_kmh,
      }));
  }, [telemetry]);

  if (!deviceId) {
    return <EmptyView label="Select a device" hint="Choose a device from the fleet list to inspect its telemetry." />;
  }

  if (loading) return <LoadingView label={`Pulling telemetry for ${deviceId}…`} />;

  if (!telemetry || telemetry.length === 0) {
    return (
      <EmptyView
        label={`No telemetry recorded for ${deviceId}`}
        hint="This device hasn't reported via POST /api/telemetry/ingest yet."
      />
    );
  }

  const latest = telemetry[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <MiniStat label="Speed" value={`${latest.speed_kmh.toFixed(1)} km/h`} />
        <MiniStat label="Ignition" value={latest.ignition_status.toUpperCase()} />
        <MiniStat label="Firmware" value={latest.firmware_version} />
        <MiniStat label="Position" value={`${latest.latitude.toFixed(3)}, ${latest.longitude.toFixed(3)}`} />
      </div>

      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Speed — last {chartData.length} readings</div>
        <div style={{ width: '100%', height: 140 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="time"
                tick={{ fill: resolveVar('var(--text-tertiary)'), fontSize: 10 }}
                axisLine={{ stroke: resolveVar('var(--border-hairline)') }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: resolveVar('var(--text-tertiary)'), fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: resolveVar('var(--bg-surface-raised)'),
                  border: `1px solid ${resolveVar('var(--border-strong)')}`,
                  borderRadius: 4,
                  fontSize: 11,
                }}
              />
              <Line type="monotone" dataKey="speed" stroke={resolveVar('var(--amber)')} strokeWidth={1.75} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {deviceAlerts && deviceAlerts.length > 0 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Alerts for {deviceId}</div>
          <AlertsTable alerts={deviceAlerts} onAcknowledge={onAcknowledge} compact />
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface-raised)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
      }}
    >
      <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      <div className="mono" style={{ fontSize: 14, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
