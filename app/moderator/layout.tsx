import { ModeratorGuard } from "@/components/auth/ModeratorGuard";
import { DashboardTopBar } from "@/components/layout/DashboardTopBar";
import { ModeratorSidebar } from "@/components/layout/ModeratorSidebar";

export default function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModeratorGuard>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50">
        <ModeratorSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <DashboardTopBar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ModeratorGuard>
  );
}
