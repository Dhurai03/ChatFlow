function Avatar({ name = '', avatarUrl = '', size = 'md', showOnline = false, isOnline = false, className = '' }) {
  const initials = name ? name.charAt(0).toUpperCase() : '?';

  const sizeMap = {
    xs: { wh: 24, font: '0.65rem', dot: 7, dotOffset: 0 },
    sm: { wh: 32, font: '0.8rem', dot: 9, dotOffset: 1 },
    md: { wh: 44, font: '1rem', dot: 11, dotOffset: 1 },
    lg: { wh: 56, font: '1.25rem', dot: 13, dotOffset: 2 },
    xl: { wh: 72, font: '1.5rem', dot: 15, dotOffset: 2 },
  };

  const { wh, font, dot, dotOffset } = sizeMap[size] || sizeMap.md;

  const hue = name
    ? name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360
    : 220;

  const style = {
    width: wh,
    height: wh,
    borderRadius: '50%',
    flexShrink: 0,
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: avatarUrl ? 'transparent' : `hsl(${hue}, 60%, 55%)`,
    color: '#fff',
    fontWeight: 700,
    fontSize: font,
    userSelect: 'none',
  };

  return (
    <span className={`avatar-wrap ${className}`} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <span style={style}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          initials
        )}
      </span>
      {showOnline && (
        <span
          style={{
            position: 'absolute',
            bottom: dotOffset,
            right: dotOffset,
            width: dot,
            height: dot,
            borderRadius: '50%',
            background: isOnline ? '#27ae60' : '#aaa',
            border: '2px solid #fff',
            zIndex: 1,
          }}
        />
      )}
    </span>
  );
}

export default Avatar;
