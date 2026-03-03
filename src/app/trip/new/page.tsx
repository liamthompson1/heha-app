"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PageShell from "@/components/PageShell";
import WizardShell from "@/components/trip/WizardShell";

function TripNewContent() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId") || undefined;
  const collect = searchParams.get("collect") || undefined;

  return (
    <PageShell backHref={tripId ? `/trip/${tripId}` : "/"} variant="full">
      <WizardShell editTripId={tripId} collectField={collect} />
    </PageShell>
  );
}

export default function TripNewPage() {
  return (
    <Suspense>
      <TripNewContent />
    </Suspense>
  );
}
