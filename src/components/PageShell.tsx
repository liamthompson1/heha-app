import clsx from "clsx";
import OrbField, { type Orb, SUBTLE_ORBS } from "./OrbField";
import BackLink from "./BackLink";

import LogoHeader from "./LogoHeader";

interface PageShellProps {
  children: React.ReactNode;
  orbs?: Orb[];
  backHref?: string;
  centered?: boolean;
  variant?: "default" | "full";
  maxWidth?: "md" | "lg" | "xl" | "5xl" | "7xl";
}

export default function PageShell({
  children,
  orbs = SUBTLE_ORBS,
  backHref,
  centered,
  variant = "default",
  maxWidth = "5xl",
}: PageShellProps) {
  const maxWidthClass = {
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "5xl": "max-w-5xl",
    "7xl": "max-w-7xl",
  }[maxWidth];

  return (
    <div
      className={clsx(
        "page-shell relative flex flex-col min-h-[100dvh] overflow-hidden bg-[var(--background)]",
        centered ? "items-center justify-center" : "items-center pt-24 pb-20"
      )}
    >
      <OrbField orbs={orbs} />
      <LogoHeader />
      {backHref && <BackLink href={backHref} />}
      <main
        className={clsx(
          "page-enter relative z-10 w-full px-6 sm:px-10",
          !centered && "flex-1 flex flex-col",
          variant === "full" ? "" : `${maxWidthClass} self-center`
        )}
        style={{
          paddingLeft: `max(1.5rem, env(safe-area-inset-left))`,
          paddingRight: `max(1.5rem, env(safe-area-inset-right))`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {children}
      </main>
    </div>
  );
}
