import { Suspense } from "react";
import { BillingClient } from "./BillingClient";

function BillingLoading() {
  return (
    <div style={{ padding: "var(--space-xl)", textAlign: "center" }}>
      <p>Lade Abrechnungsdaten...</p>
    </div>
  );
}

export default async function BillingPage() {
  return (
    <Suspense fallback={<BillingLoading />}>
      <BillingClient />
    </Suspense>
  );
}

