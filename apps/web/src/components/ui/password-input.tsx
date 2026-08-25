"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

/** A password Input with a show/hide toggle inside the field, on the
 * right — built on the canonical Input rather than a new primitive, since
 * every other prop (id, value, onChange, placeholder, required...) needs
 * to keep working exactly as it does on a plain password Input. */
export const PasswordInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const { t } = useLanguage();

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-11", className)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("authHidePassword") : t("authShowPassword")}
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-(--text-muted) transition-colors hover:text-(--text-secondary) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-[var(--radius-sm)]"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
