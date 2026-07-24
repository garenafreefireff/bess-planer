import { PortalAuthenticatedLayout } from "@/features/auth/components/customer-portal-page";
import { MyProjectsApiPage } from "@/features/bess-planner/components/my-projects-api-page";

export default function PortalProjectsRoute() {
  return (
    <PortalAuthenticatedLayout activeItem="Dự án của tôi">
      <MyProjectsApiPage />
    </PortalAuthenticatedLayout>
  );
}
