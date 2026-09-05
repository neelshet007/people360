import React, { useState } from 'react';

/**
 * Shared Tooltip Component
 * Owner: P1 (Core HR)
 */
export default function Tooltip({
  content,
  children,
  position = 'top', // top, bottom, left, right
  className = '',
}) {
  const [visible, setVisible] = useState(false);

  const positionStyles = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: '6px',
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '6px',
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: '6px',
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: '6px',
    },
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className={`tooltip-wrapper ${className}`}
    >
      {children}
      {visible && content && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            backgroundColor: 'var(--neutral-900, #0f172a)',
            color: '#ffffff',
            fontSize: '0.75rem',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm, 4px)',
            boxShadow: 'var(--shadow-md)',
            pointerEvents: 'none',
            ...positionStyles[position],
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
