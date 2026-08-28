import { DeviceStatusDot } from './Tags';
import { EmptyView } from './StateViews';

function isStale(lastSeen) {
  if (!lastSeen) return true;
  const d = new Date(lastSeen.endsWith('Z') ? lastSeen : `${lastSeen}Z`);
  return Date.now() - d.getTime() > 30000;
}

function formatRelative(ts) {
  if (!ts) return 'Never';
  const d = new Date(ts.endsWith('Z') ? ts : `${ts}Z`);
  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return `${Math.floor(diffSec / 3600)}h ago`;
}

export function DevicesPanel({ devices, alertsByDevice, selectedDeviceId, onSelectDevice }) {
  if (!devices || devices.length === 0) {
    return (
      <EmptyView
        label="No devices registered"
        hint="Devices appear here once registered via POST /api/devices/register."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {devices.map((device, i) => {
        const openAlerts = (alertsByDevice[device.device_id] || []).filter((a) => !a.acknowledged);
        const stale = isStale(device.last_seen);
        const isSelected = selectedDeviceId === device.device_id;

        return (
          <button
            key={device.id}
            onClick={() => onSelectDevice(device.device_id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              textAlign: 'left',
              padding: '12px 18px',
              background: isSelected ? 'var(--amber-glow)' : 'transparent',
              border: 'none',
              borderTop: i === 0 ? 'none' : '1px solid var(--border-hairline)',
              borderLeft: isSelected ? '2px solid var(--amber)' : '2px solid transparent',
              cursor: 'pointer',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
              <span className="mono" style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                {device.device_id}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                Firmware {device.firmware_version} · seen {formatRelative(device.last_seen)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
              {openAlerts.length > 0 && (
                <span
                  className="mono"
                  style={{
                    fontSize: 10.5,
                    color: 'var(--sev-critical)',
                    border: '1px solid var(--sev-critical)66',
                    background: 'var(--sev-critical-glow)',
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {openAlerts.length} open
                </span>
              )}
              <DeviceStatusDot status={device.status} lastSeenStale={stale} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
