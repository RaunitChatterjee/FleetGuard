import { EmptyView } from './StateViews';

const ATTACK_LABELS = {
  impossible_travel: 'GPS spoofing detected',
  replay_attack: 'Replay attack detected',
  device_impersonation: 'Device impersonation detected',
  unauthorized_device: 'Unauthorized device blocked',
  firmware_regression: 'Firmware regression detected',
};

const SEVERITY_COLOR = {
  critical: 'var(--sev-critical)',
  high: 'var(--sev-high)',
  medium: 'var(--sev-medium)',
  low: 'var(--sev-low)',
};

function relativeTime(ts) {
  const d = new Date(ts.endsWith('Z') ? ts : `${ts}Z`);
  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function ActivityTimeline({ alerts, limit = 8 }) {
  if (!alerts || alerts.length === 0) {
    return <EmptyView label="No recent activity" />;
  }

  const recent = alerts.slice(0, limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {recent.map((alert, i) => (
        <div
          key={alert.id}
          style={{
            display: 'flex',
            gap: 12,
            padding: '10px 18px',
            borderTop: i === 0 ? 'none' : '1px solid var(--border-hairline)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: SEVERITY_COLOR[alert.severity],
                boxShadow: alert.severity === 'critical' ? `0 0 5px ${SEVERITY_COLOR[alert.severity]}` : 'none',
                flexShrink: 0,
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>
                {ATTACK_LABELS[alert.alert_type] || alert.alert_type}
              </span>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                {relativeTime(alert.timestamp)}
              </span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {alert.device_id}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
