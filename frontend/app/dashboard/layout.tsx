import Sidebar from "./components/Sidebar";
import DashboardHeader from "./components/DashboardHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <DashboardHeader />
      <main className="ml-60 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
