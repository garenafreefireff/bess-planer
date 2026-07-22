import { PortalAuthenticatedLayout } from "@/features/auth/components/customer-portal-page";
import { BessPlannerResultPage } from "@/features/bess-planner/components/bess-planner-result-page";

export default function PortalBessPlannerResultRoute() {
  return (
    <PortalAuthenticatedLayout activeItem="Dự án của tôi">
      <BessPlannerResultPage embedded />
    </PortalAuthenticatedLayout>
  );
}
