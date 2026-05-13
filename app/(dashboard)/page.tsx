import { AppHeader } from "@/components/layout/app-header"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default function DashboardPage() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Dashboard" }]} />
      <div className="flex-1 overflow-auto">
        <DashboardContent />
      </div>
    </>
  )
}
