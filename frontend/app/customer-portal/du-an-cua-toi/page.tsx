import { PortalAuthenticatedLayout } from "@/features/auth/components/customer-portal-page";
import { MyProjectsPage } from "@/features/bess-planner/components/my-projects-page";

export default function PortalProjectsRoute() {
  return (
    <PortalAuthenticatedLayout activeItem="Dự án của tôi">
      <MyProjectsPage />
    </PortalAuthenticatedLayout>
  );
}
