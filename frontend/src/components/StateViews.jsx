import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

export function LoadingView({ label = 'Establishing uplink…' }) {
  return (
    <div style={wrap}>
      <Loader2 size={20} color="var(--amber)" className="spin" />
      <p className="mono" style={msg}>{label}</p>
      <style>{`.spin { animation: fg-spin 0.9s linear infinite; } @keyframes fg-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ErrorView({ error, onRetry }) {
  return (
    <div style={wrap}>
      <AlertTriangle size={20} color="var(--sev-critical)" />
      <p className="mono" style={{ ...msg, color: 'var(--sev-critical)' }}>
        {error?.message || 'Connection to the FleetGuard API failed.'}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 360, textAlign: 'center' }}>
        Confirm the backend is running and reachable, then retry the connection.
      </p>
      {onRetry && (
        <button onClick={onRetry} style={retryBtn}>
          Retry connection
        </button>
      )}
    </div>
  );
}

export function EmptyView({ label = 'No data reported yet', hint }) {
  return (
    <div style={wrap}>
      <Inbox size={20} color="var(--text-tertiary)" />
      <p className="mono" style={msg}>{label}</p>
      {hint && <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{hint}</p>}
    </div>
  );
}

const wrap = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: '48px 24px',
  width: '100%',
};

const msg = {
  fontSize: 12.5,
  letterSpacing: '0.03em',
  color: 'var(--text-secondary)',
};

const retryBtn = {
  marginTop: 6,
  background: 'var(--bg-surface-raised)',
  border: '1px solid var(--border-strong)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11.5,
  letterSpacing: '0.06em',
  padding: '7px 14px',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
};
