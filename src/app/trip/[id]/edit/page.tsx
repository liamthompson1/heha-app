"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PageShell from "@/components/PageShell";
import EditTripShell from "@/components/trip/EditTripShell";

function EditTripContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const collect = searchParams.get("collect") || undefined;

  return (
    <PageShell backHref={`/trip/${id}`} variant="full">
      <EditTripShell tripId={id} collectField={collect} />
    </PageShell>
  );
}

export default function EditTripPage() {
  return (
    <Suspense>
      <EditTripContent />
    </Suspense>
  );
}
