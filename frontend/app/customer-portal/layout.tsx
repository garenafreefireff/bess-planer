import { Suspense, type ReactNode } from "react";

import { PortalAuthenticatedLayout } from "@/features/auth/components/customer-portal-page";

export default function CustomerPortalLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PortalAuthenticatedLayout>{children}</PortalAuthenticatedLayout>
    </Suspense>
  );
}
