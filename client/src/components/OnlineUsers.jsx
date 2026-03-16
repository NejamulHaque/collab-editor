export default function OnlineUsers({ peers, currentUser, darkMode }) {
  const everyone = [
    { name: currentUser?.name, color: '#6366f1', isYou: true },
    ...peers
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {everyone.slice(0, 5).map((p, i) => (
        <div
          key={i}
          title={p.isYou ? `${p.name} (you)` : p.name}
          style={{
            width: 28, height: 28,
            borderRadius: '50%',
            background: p.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            border: p.isYou ? '2px solid #6366f1' : '2px solid transparent',
            marginLeft: i > 0 ? -6 : 0,
            cursor: 'default',
            userSelect: 'none',
            boxShadow: '0 0 0 2px ' + (darkMode ? '#16213e' : '#fff'),
            zIndex: everyone.length - i,
            position: 'relative'
          }}
        >
          {p.name?.[0]?.toUpperCase() || '?'}
        </div>
      ))}
      {everyone.length > 5 && (
        <div style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>+{everyone.length - 5}</div>
      )}
      {everyone.length > 0 && (
        <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>
          {everyone.length} online
        </span>
      )}
    </div>
  )
}