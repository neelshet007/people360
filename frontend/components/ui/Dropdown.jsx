import React, { useState, useRef, useEffect } from 'react';

/**
 * Shared Dropdown Component
 * Owner: P1 (Core HR)
 */
export default function Dropdown({
  trigger,
  items = [],
  align = 'right', // left, right
  className = '',
  style = {},
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', ...style }} className={`dropdown ${className}`}>
      <div onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      {open && (
        <div
          style={{
            position: 'absolute',
            ...(align === 'right' ? { right: 0 } : { left: 0 }),
            marginTop: '6px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--neutral-200, #e2e8f0)',
            minWidth: '180px',
            zIndex: 100,
            padding: '4px 0',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={index}
                  style={{
                    height: '1px',
                    backgroundColor: 'var(--neutral-200, #e2e8f0)',
                    margin: '4px 0',
                  }}
                />
              );
            }

            return (
              <div
                key={index}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.();
                    setOpen(false);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  fontSize: '0.875rem',
                  color: item.disabled
                    ? 'var(--neutral-400, #94a3b8)'
                    : item.danger
                    ? 'var(--danger, #ef4444)'
                    : 'var(--neutral-700, #334155)',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--neutral-100, #f1f5f9)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
