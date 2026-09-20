import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardTopBar } from "@/components/layout/DashboardTopBar";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen w-full overflow-hidden bg-niramayah-light">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <DashboardTopBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
