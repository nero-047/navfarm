"use client";

import { useLanguage } from "../../hooks/useLanguage";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        style={{
          padding: "0 24px 0 10px",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          backgroundColor: "transparent",
          color: "var(--text-secondary)",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          outline: "none",
          height: "32px",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          transition: "border-color 150ms, color 150ms",
        }}
        onMouseEnter={(e) => {
          const b = e.currentTarget;
          b.style.borderColor = "var(--accent)";
          b.style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          const b = e.currentTarget;
          b.style.borderColor = "var(--border)";
          b.style.color = "var(--text-secondary)";
        }}
      >
        <option value="en" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>EN</option>
        <option value="hi" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>HI</option>
        <option value="mr" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>MR</option>
        <option value="es" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>ES</option>
        <option value="fr" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>FR</option>
        <option value="bn" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>BN</option>
        <option value="te" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>TE</option>
        <option value="ta" style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>TA</option>
      </select>
      <span style={{
        position: "absolute",
        right: "8px",
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
        color: "var(--text-muted)",
        fontSize: "8px",
        display: "flex",
        alignItems: "center"
      }}>
        ▼
      </span>
    </div>
  );
}
