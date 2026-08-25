import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The one page-level container every route renders into. Before this, each
 * module's *-page-shell.tsx hand-typed its own max-width/padding/vertical-
 * rhythm combination — eight different variants for a page frame that should
 * only ever have one, which is why the same PageHeader read at a subtly
 * different width and bottom margin depending on which module you were in.
 *
 * `size="default"` is the normal content width every full page uses.
 * `size="narrow"` is for restricted/access-denied states, which already
 * agreed on max-w-2xl across most shells before this existed — this just
 * gives that agreement one place to live instead of five copies of it.
 */
export function ConsolePage({
  children,
  size = "default",
  className,
}: {
  children: ReactNode;
  size?: "default" | "narrow";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto space-y-6 px-4 pb-6 sm:px-6 lg:px-7",
        size === "narrow" ? "max-w-2xl" : "max-w-7xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export default ConsolePage;
