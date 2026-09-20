import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { DashboardTopBar } from "@/components/layout/DashboardTopBar";
import { AdminGuard } from "@/components/auth/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50">
        <AdminSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <DashboardTopBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
