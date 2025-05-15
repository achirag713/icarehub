import React from 'react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    fullWidth ? 'btn-block' : '',
    disabled ? 'btn-disabled' : '',
    loading ? 'btn-loading' : '',
    icon ? 'btn-icon' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {loading ? (
        <span className="loading-indicator" />
      ) : (
        <>
          {icon && <span className="icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;