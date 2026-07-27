import { Suspense, type ReactNode } from "react";

import { AdminAuthenticatedLayout } from "@/features/admin/components/admin-auth-gate";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <AdminAuthenticatedLayout>{children}</AdminAuthenticatedLayout>
    </Suspense>
  );
}
