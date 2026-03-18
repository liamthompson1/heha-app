"use client";

import PageShell from "@/components/PageShell";
import WizardShell from "@/components/trip/WizardShell";

export default function TripNewPage() {
  return (
    <PageShell backHref="/" variant="full">
      <WizardShell />
    </PageShell>
  );
}
