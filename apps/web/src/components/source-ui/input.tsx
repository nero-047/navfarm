import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  icon, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Sentence case, matching the hand-written field labels these sit beside.
          All-caps was applied here only, so a single form rendered two label
          styles depending on which control each field happened to use. */}
      {label && <label className="nf-text-label" style={{ color: "var(--text-secondary)" }}>{label}</label>}
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
            {icon}
          </div>
        )}
        <input 
          className={`w-full rounded-[var(--radius-sm)] h-11 pr-4 text-sm focus:border-(--accent)/40 focus:ring-1 focus:ring-(--accent)/20 outline-none ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${className}`}
          style={{
            backgroundColor: "var(--input-bg)",
            color: "var(--input-text)",
            border: "1px solid var(--input-border)",
          }}
          {...props}
        />
      </div>
    </div>
  );
};
export default Input;
