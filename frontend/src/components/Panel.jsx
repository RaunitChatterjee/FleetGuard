export function Panel({ title, eyebrow, action, children, style, bodyStyle }) {
  return (
    <section
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        ...style,
      }}
    >
      {(title || action) && (
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-hairline)',
          }}
        >
          <div>
            {eyebrow && <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
            {title && (
              <h2 style={{ fontSize: 14.5, color: 'var(--text-primary)', fontWeight: 600 }}>
                {title}
              </h2>
            )}
          </div>
          {action}
        </header>
      )}
      <div style={{ flex: 1, minHeight: 0, ...bodyStyle }}>{children}</div>
    </section>
  );
}
