import { LayoutGrid, ShieldAlert, Truck } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'alerts', label: 'Alerts', icon: ShieldAlert },
  { id: 'fleet', label: 'Fleet', icon: Truck },
];

export function Sidebar({ active, onChange, criticalCount }) {
  return (
    <nav
      style={{
        width: 76,
        flexShrink: 0,
        background: 'var(--bg-base)',
        borderRight: '1px solid var(--border-hairline)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 18,
        gap: 6,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            aria-current={isActive}
            className="nav-item"
            style={{
              width: 58,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 5,
              padding: '10px 0',
              background: isActive ? 'var(--amber-glow)' : undefined,
              border: 'none',
              borderLeft: isActive ? '2px solid var(--amber)' : '2px solid transparent',
              color: isActive ? 'var(--amber)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <Icon size={18} strokeWidth={2} />
            <span
              className="mono"
              style={{ fontSize: 9.5, letterSpacing: '0.04em', textTransform: 'uppercase' }}
            >
              {item.label}
            </span>
            {item.id === 'alerts' && criticalCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 12,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--sev-critical)',
                  boxShadow: '0 0 6px var(--sev-critical)',
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
