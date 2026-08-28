import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { SeverityTag, AckTag } from './Tags';
import { EmptyView } from './StateViews';

const ATTACK_LABELS = {
  impossible_travel: 'GPS Spoofing / Impossible Travel',
  replay_attack: 'Replay Attack',
  device_impersonation: 'Device Impersonation',
  unauthorized_device: 'Unauthorized Device',
  firmware_regression: 'Firmware Regression',
};

function formatTimestamp(ts) {
  try {
    const d = new Date(ts.endsWith('Z') ? ts : `${ts}Z`);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return ts;
  }
}

export function AlertsTable({ alerts, onAcknowledge, filter = 'all', compact = false }) {
  const [pendingIds, setPendingIds] = useState(new Set());

  if (!alerts || alerts.length === 0) {
    return <EmptyView label="No alerts recorded" hint="The threat feed populates as detections fire on incoming telemetry." />;
  }

  const filtered = filter === 'unacknowledged' ? alerts.filter((a) => !a.acknowledged) : alerts;

  if (filtered.length === 0) {
    return <EmptyView label="All alerts acknowledged" hint="No open items in the current filter." />;
  }

  const handleAck = async (id) => {
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      await onAcknowledge(id);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
        <thead>
          <tr>
            {['Severity', 'Device', 'Attack Type', 'MITRE ATT&CK', 'Timestamp', 'Status', ''].map((h) => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((alert) => {
            const isPending = pendingIds.has(alert.id);
            return (
              <tr key={alert.id} style={{ borderTop: '1px solid var(--border-hairline)' }}>
                <td style={td}><SeverityTag severity={alert.severity} /></td>
                <td style={{ ...td, ...tdMono }}>{alert.device_id}</td>
                <td style={td}>
                  <div style={{ color: 'var(--text-primary)' }}>
                    {ATTACK_LABELS[alert.alert_type] || alert.alert_type}
                  </div>
                  {!compact && (
                    <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {alert.details}
                    </div>
                  )}
                </td>
                <td style={{ ...td, ...tdMono, color: 'var(--text-secondary)', fontSize: 12 }}>
                  {alert.mitre_mapping || '—'}
                </td>
                <td style={{ ...td, ...tdMono, color: 'var(--text-tertiary)', fontSize: 12 }}>
                  {formatTimestamp(alert.timestamp)}
                </td>
                <td style={td}><AckTag acknowledged={alert.acknowledged} /></td>
                <td style={{ ...td, textAlign: 'right' }}>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAck(alert.id)}
                      disabled={isPending}
                      style={ackBtn}
                    >
                      {isPending ? (
                        <Loader2 size={12} className="spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      Acknowledge
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <style>{`.spin { animation: fg-spin 0.8s linear infinite; } @keyframes fg-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const th = {
  textAlign: 'left',
  padding: '10px 16px',
  fontFamily: 'var(--font-mono)',
  fontSize: 10.5,
  letterSpacing: '0.08em',
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  fontWeight: 500,
  whiteSpace: 'nowrap',
};

const td = {
  padding: '11px 16px',
  fontSize: 13,
  color: 'var(--text-secondary)',
  verticalAlign: 'top',
};

const tdMono = {
  fontFamily: 'var(--font-mono)',
};

const ackBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: '1px solid var(--border-strong)',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.04em',
  padding: '6px 10px',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
