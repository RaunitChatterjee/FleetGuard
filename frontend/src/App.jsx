import { useMemo, useState } from 'react';
import { AlertTriangle, Radio, ShieldAlert, ShieldCheck, Truck } from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Panel } from './components/Panel';
import { StatCard } from './components/StatCard';
import { FleetGrid } from './components/FleetGrid';
import { AlertsTable } from './components/AlertsTable';
import { ThreatDistribution } from './components/ThreatDistribution';
import { ActivityTimeline } from './components/ActivityTimeline';
import { DevicesPanel } from './components/DevicesPanel';
import { DeviceDetail } from './components/DeviceDetail';
import { LoadingView, ErrorView } from './components/StateViews';

import { usePolling } from './hooks/usePolling';
import { useFleetPositions } from './hooks/useFleetPositions';
import { getStats, getAlerts, getDevices, getDeviceTelemetry, acknowledgeAlert } from './lib/api';

function groupAlertsByDevice(alerts) {
  const map = {};
  for (const alert of alerts || []) {
    if (!map[alert.device_id]) map[alert.device_id] = [];
    map[alert.device_id].push(alert);
  }
  return map;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  const stats = usePolling(getStats, { intervalMs: 4000 });
  const alerts = usePolling(getAlerts, { intervalMs: 4000 });
  const devices = usePolling(getDevices, { intervalMs: 6000 });

  const { positions: fleetPositions, loading: positionsLoading } = useFleetPositions(
    devices.data || [],
    5000
  );

  const deviceTelemetry = usePolling(
    () => (selectedDeviceId ? getDeviceTelemetry(selectedDeviceId) : Promise.resolve(null)),
    { intervalMs: 4000, deps: [selectedDeviceId] }
  );

  const alertsByDevice = useMemo(() => groupAlertsByDevice(alerts.data), [alerts.data]);

  // Any panel failing to reach the API is treated as a link failure for the header indicator.
  const connected = !stats.error && !alerts.error && !devices.error;

  const handleAcknowledge = async (alertId) => {
    await acknowledgeAlert(alertId);
    await alerts.refetch();
    await stats.refetch();
  };

  const handleSelectDevice = (deviceId) => {
    setSelectedDeviceId(deviceId);
    setActiveTab('fleet');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBar
        criticalCount={stats.data?.critical_alerts ?? 0}
        unacknowledgedCount={stats.data?.unacknowledged_alerts ?? 0}
        connected={connected}
      />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar
          active={activeTab}
          onChange={setActiveTab}
          criticalCount={stats.data?.critical_alerts ?? 0}
        />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              alerts={alerts}
              devices={devices}
              fleetPositions={fleetPositions}
              positionsLoading={positionsLoading}
              alertsByDevice={alertsByDevice}
              onAcknowledge={handleAcknowledge}
              onSelectDevice={handleSelectDevice}
              selectedDeviceId={selectedDeviceId}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsTab alerts={alerts} onAcknowledge={handleAcknowledge} />
          )}

          {activeTab === 'fleet' && (
            <FleetTab
              devices={devices}
              alertsByDevice={alertsByDevice}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={setSelectedDeviceId}
              deviceTelemetry={deviceTelemetry}
              onAcknowledge={handleAcknowledge}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function OverviewTab({
  stats,
  alerts,
  devices,
  fleetPositions,
  positionsLoading,
  alertsByDevice,
  onAcknowledge,
  onSelectDevice,
  selectedDeviceId,
}) {
  if (stats.loading && !stats.data) return <LoadingView label="Connecting to FleetGuard API…" />;
  if (stats.error && !stats.data) return <ErrorView error={stats.error} onRetry={stats.refetch} />;

  const s = stats.data || {};

  return (
    <>
      <div className="grid-stats">
        <StatCard label="Fleet Devices" value={s.total_devices ?? '—'} icon={Truck} accent="neutral" />
        <StatCard label="Total Alerts" value={s.total_alerts ?? '—'} icon={ShieldAlert} accent="neutral" />
        <StatCard label="Critical" value={s.critical_alerts ?? '—'} icon={AlertTriangle} accent="critical" />
        <StatCard label="High" value={s.high_alerts ?? '—'} icon={Radio} accent="amber" />
        <StatCard label="Medium" value={s.medium_alerts ?? '—'} icon={ShieldCheck} accent="neutral" />
        <StatCard label="Low" value={s.low_alerts ?? '—'} icon={ShieldCheck} accent="neutral" />
        <StatCard
          label="Unacknowledged"
          value={s.unacknowledged_alerts ?? '—'}
          icon={AlertTriangle}
          accent={s.unacknowledged_alerts > 0 ? 'amber' : 'neutral'}
        />
      </div>

      <div className="grid-overview-row" style={{ minHeight: 320 }}>
        <Panel eyebrow="Live Fleet" title="Vehicle Telemetry Grid" style={{ minHeight: 320 }}>
          <FleetGrid
            devices={devices.data || []}
            positions={fleetPositions}
            loading={positionsLoading && !devices.data}
            alertsByDevice={alertsByDevice}
            onSelectDevice={onSelectDevice}
            selectedDeviceId={selectedDeviceId}
          />
        </Panel>

        <Panel eyebrow="Threat Activity" title="Recent Attack Activity" style={{ minHeight: 320 }}>
          {alerts.loading && !alerts.data ? (
            <LoadingView />
          ) : alerts.error && !alerts.data ? (
            <ErrorView error={alerts.error} onRetry={alerts.refetch} />
          ) : (
            <ActivityTimeline alerts={alerts.data} limit={9} />
          )}
        </Panel>
      </div>

      <div className="grid-overview-row grid-overview-row--reverse">
        <Panel eyebrow="Distribution" title="Alerts by Attack Type">
          <div style={{ padding: 18 }}>
            {alerts.loading && !alerts.data ? (
              <LoadingView />
            ) : (
              <ThreatDistribution alerts={alerts.data} />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow="Security Status"
          title="Unacknowledged Alerts"
          style={{ minHeight: 0 }}
        >
          {alerts.loading && !alerts.data ? (
            <LoadingView />
          ) : alerts.error && !alerts.data ? (
            <ErrorView error={alerts.error} onRetry={alerts.refetch} />
          ) : (
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <AlertsTable alerts={alerts.data} onAcknowledge={onAcknowledge} filter="unacknowledged" compact />
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function AlertsTab({ alerts, onAcknowledge }) {
  const [filter, setFilter] = useState('all');

  return (
    <Panel
      eyebrow="Security Alerts"
      title="All Alerts"
      action={
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'unacknowledged'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.04em',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${filter === f ? 'var(--amber)' : 'var(--border-strong)'}`,
                background: filter === f ? 'var(--amber-glow)' : 'transparent',
                color: filter === f ? 'var(--amber)' : 'var(--text-secondary)',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {f === 'all' ? 'All' : 'Unacknowledged'}
            </button>
          ))}
        </div>
      }
    >
      {alerts.loading && !alerts.data ? (
        <LoadingView label="Pulling alert feed…" />
      ) : alerts.error && !alerts.data ? (
        <ErrorView error={alerts.error} onRetry={alerts.refetch} />
      ) : (
        <AlertsTable alerts={alerts.data} onAcknowledge={onAcknowledge} filter={filter} />
      )}
    </Panel>
  );
}

function FleetTab({ devices, alertsByDevice, selectedDeviceId, onSelectDevice, deviceTelemetry, onAcknowledge }) {
  return (
    <div className="grid-fleet">
      <Panel eyebrow="Registered Devices" title="Fleet Roster" bodyStyle={{ overflowY: 'auto' }}>
        {devices.loading && !devices.data ? (
          <LoadingView />
        ) : devices.error && !devices.data ? (
          <ErrorView error={devices.error} onRetry={devices.refetch} />
        ) : (
          <DevicesPanel
            devices={devices.data}
            alertsByDevice={alertsByDevice}
            selectedDeviceId={selectedDeviceId}
            onSelectDevice={onSelectDevice}
          />
        )}
      </Panel>

      <Panel
        eyebrow="Device Telemetry"
        title={selectedDeviceId ? `${selectedDeviceId} — Telemetry Detail` : 'Select a device'}
        bodyStyle={{ overflowY: 'auto' }}
      >
        <DeviceDetail
          deviceId={selectedDeviceId}
          telemetry={deviceTelemetry.data}
          loading={deviceTelemetry.loading}
          deviceAlerts={selectedDeviceId ? alertsByDevice[selectedDeviceId] : []}
          onAcknowledge={onAcknowledge}
        />
      </Panel>
    </div>
  );
}
