import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-[248px]">
        <Header />
        <main className="mx-auto max-w-[1280px] px-4 pb-28 pt-6 md:px-8 md:pb-12">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
