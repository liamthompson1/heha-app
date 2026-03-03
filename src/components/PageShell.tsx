import clsx from "clsx";
import OrbField, { type Orb, SUBTLE_ORBS } from "./OrbField";
import BackLink from "./BackLink";
import AuthStatus from "./AuthStatus";
import LogoHeader from "./LogoHeader";

interface PageShellProps {
  children: React.ReactNode;
  orbs?: Orb[];
  backHref?: string;
  centered?: boolean;
  variant?: "default" | "full";
}

export default function PageShell({
  children,
  orbs = SUBTLE_ORBS,
  backHref,
  centered,
  variant = "default",
}: PageShellProps) {
  return (
    <div
      className={clsx(
        "page-shell relative flex flex-col min-h-[100dvh] overflow-hidden bg-[var(--background)]",
        centered ? "items-center justify-center" : "items-center pt-20 pb-16"
      )}
    >
      <OrbField orbs={orbs} />
      <LogoHeader />
      {backHref && <BackLink href={backHref} />}
      <AuthStatus />
      <main
        className={clsx(
          "page-enter relative z-10 mx-4 w-full",
          !centered && "flex-1 flex flex-col",
          variant === "full" ? "" : "max-w-2xl self-center"
        )}
        style={{
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {children}
      </main>
    </div>
  );
}
