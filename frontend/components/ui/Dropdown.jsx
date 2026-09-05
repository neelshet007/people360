import React, { useState, useRef, useEffect } from 'react';

/**
 * Shared Dropdown Component
 * Owner: P1 (Core HR)
 */
export default function Dropdown({ trigger, items = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '8px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--neutral-200, #e2e8f0)',
            minWidth: '160px',
            zIndex: 100,
            padding: '4px 0',
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                item.onClick?.();
                setOpen(false);
              }}
              style={{
                padding: '8px 16px',
                fontSize: '0.875rem',
                color: item.danger ? 'var(--danger, #ef4444)' : 'var(--neutral-700, #334155)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--neutral-100, #f1f5f9)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
