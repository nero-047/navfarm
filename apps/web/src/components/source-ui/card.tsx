import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  glow = false, 
  className = '', 
  ...props 
}) => {
  return (
    <div 
      className={`rounded-xl p-6 relative overflow-hidden ${
        glow ? 'shadow-lg border-teal-500/20' : ''
      } ${className}`}
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        color: 'var(--text-primary)',
      }}
      {...props}
    >
      {children}
    </div>
  );
};
export default Card;
