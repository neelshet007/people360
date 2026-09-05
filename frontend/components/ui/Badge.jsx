import React from 'react';

/**
 * Enterprise Badge / Pill Component
 * Standard semantic status indicators: success, warning, danger, info, neutral, brand, primary
 */
export default function Badge({
  children,
  variant = 'neutral', // neutral, success, warning, danger, info, brand, primary
  dot = false,
  className = '',
  style = {},
}) {
  // Normalize legacy aliases
  let safeVariant = variant;
  if (variant === 'primary') safeVariant = 'info';
  if (variant === 'error') safeVariant = 'danger';

  return (
    <span
      style={style}
      className={`pp-badge pp-badge-${safeVariant} ${className}`}
    >
      {dot && <span className="pp-badge-dot" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}
