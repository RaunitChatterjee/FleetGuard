import { useMemo } from 'react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyView } from './StateViews';

const ATTACK_LABELS = {
  impossible_travel: 'GPS Spoofing',
  replay_attack: 'Replay Attack',
  device_impersonation: 'Impersonation',
  unauthorized_device: 'Unauthorized Device',
  firmware_regression: 'Firmware Regression',
};

const SEVERITY_COLOR = {
  critical: 'var(--sev-critical)',
  high: 'var(--sev-high)',
  medium: 'var(--sev-medium)',
  low: 'var(--sev-low)',
};

function resolveVar(cssVar) {
  if (typeof window === 'undefined') return '#f5a623';
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar.replace('var(', '').replace(')', '')).trim() || '#f5a623';
}

function BarCountLabel({ x, y, width, height, value }) {
  return (
    <text
      x={x + width + 6}
      y={y + height / 2}
      dy={4}
      fontFamily="var(--font-mono)"
      fontSize={11.5}
      fontWeight={600}
      fill={resolveVar('var(--text-primary)')}
    >
      {value}
    </text>
  );
}

export function ThreatDistribution({ alerts }) {
  const data = useMemo(() => {
    if (!alerts || alerts.length === 0) return [];
    const counts = {};
    for (const alert of alerts) {
      const key = alert.alert_type;
      if (!counts[key]) counts[key] = { critical: 0, high: 0, medium: 0, low: 0 };
      counts[key][alert.severity] = (counts[key][alert.severity] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([type, sevCounts]) => {
        const total = Object.values(sevCounts).reduce((a, b) => a + b, 0);
        const dominant = Object.entries(sevCounts).sort((a, b) => b[1] - a[1])[0][0];
        return {
          name: ATTACK_LABELS[type] || type,
          total,
          dominant,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [alerts]);

  if (data.length === 0) {
    return <EmptyView label="No threat activity to chart yet" />;
  }

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fill: resolveVar('var(--text-secondary)'), fontSize: 11.5, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{
              background: resolveVar('var(--bg-surface-raised)'),
              border: `1px solid ${resolveVar('var(--border-strong)')}`,
              borderRadius: 4,
              fontSize: 12,
              fontFamily: 'JetBrains Mono',
            }}
            labelStyle={{ color: resolveVar('var(--text-primary)') }}
          />
          <Bar dataKey="total" radius={[0, 2, 2, 0]} barSize={16}>
            <LabelList
              dataKey="total"
              position="right"
              content={(props) => <BarCountLabel {...props} />}
            />
            {data.map((entry) => (
              <Cell key={entry.name} fill={resolveVar(SEVERITY_COLOR[entry.dominant])} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
