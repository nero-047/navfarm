"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";

// Each language's own name, in its own script — not the English name and
// not a 2-letter code — so a reader who can't read English can still find
// their language in the list.
const NATIVE_NAMES: Record<string, string> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
  es: "Español",
  fr: "Français",
  bn: "বাংলা",
  te: "తెలుగు",
  ta: "தமிழ்",
};

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <Globe
        size={14}
        style={{
          position: "absolute",
          left: "9px",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "var(--text-muted)",
        }}
      />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        aria-label="Language"
        style={{
          padding: "0 24px 0 28px",
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
        {Object.entries(NATIVE_NAMES).map(([code, name]) => (
          <option key={code} value={code} style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>
            {name}
          </option>
        ))}
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
