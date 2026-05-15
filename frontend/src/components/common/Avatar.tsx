import React from 'react';

interface AvatarProps {
  name: string;
  size?: number;
  online?: boolean;
}

const colors = ['#1abc9c','#2ecc71','#3498db','#9b59b6','#e67e22','#e74c3c','#1ca1f2','#f39c12'];

const getColor = (name: string) => colors[name.charCodeAt(0) % colors.length];

export const Avatar: React.FC<AvatarProps> = ({ name, size = 40, online }) => {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: getColor(name || ''),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: '600',
        color: 'white',
        userSelect: 'none',
        flexShrink: 0,
      }}>
        {initial}
      </div>
      {online !== undefined && (
        <div style={{
          position: 'absolute',
          bottom: 1,
          right: 1,
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: '50%',
          background: online ? '#06cf9c' : '#667781',
          border: '2px solid var(--bg-panel)',
        }} />
      )}
    </div>
  );
};
