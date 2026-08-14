import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  disabled,
  style,
  ...props 
}) => {
  const baseStyle = 'min-h-11 px-5 py-2.5 font-semibold text-sm cursor-pointer flex items-center justify-center gap-2 transition-colors nf-press focus-visible:outline-none';
  const radiusStyle = variant === 'primary' || variant === 'danger' ? 'rounded-[var(--radius-pill)]' : 'rounded-[var(--radius-sm)]';
  
  // Custom styles for each variant that adapt to light and dark themes
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--accent)',
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: 'var(--surface-raised)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
    },
    outline: {
      backgroundColor: 'var(--surface)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
    },
    danger: {
      backgroundColor: 'var(--danger)',
      color: '#ffffff',
    },
  };

  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  return (
    <button 
      className={`${baseStyle} ${radiusStyle} ${disabledStyle} ${className}`}
      disabled={disabled}
      style={{
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};
export default Button;
