import clsx from "clsx";
import OrbField, { type Orb, SUBTLE_ORBS } from "./OrbField";
import BackLink from "./BackLink";
import AuthStatus from "./AuthStatus";

const maxWidthClasses = {
  "2xl": "max-w-2xl",
  "6xl": "max-w-6xl",
  full: "max-w-full",
};

interface PageShellProps {
  children: React.ReactNode;
  orbs?: Orb[];
  backHref?: string;
  centered?: boolean;
  maxWidth?: "2xl" | "6xl" | "full";
}

export default function PageShell({
  children,
  orbs = SUBTLE_ORBS,
  backHref,
  centered,
  maxWidth = "2xl",
}: PageShellProps) {
  return (
    <div
      className={clsx(
        "relative flex min-h-screen overflow-hidden bg-[var(--background)]",
        centered ? "items-center justify-center" : "items-start justify-center pt-24 pb-16"
      )}
    >
      <OrbField orbs={orbs} />
      {backHref && <BackLink href={backHref} />}
      <AuthStatus />
      <main className={clsx("page-enter relative z-10 mx-4 w-full", maxWidthClasses[maxWidth])}>
        {children}
      </main>
    </div>
  );
}
