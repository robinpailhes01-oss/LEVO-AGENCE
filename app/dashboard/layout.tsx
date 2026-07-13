import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { AutoRefresh } from "@/components/layout/AutoRefresh";
import { authEnabled } from "@/lib/auth";
import { getRecentReplies, getPendingAuditsCount, getFollowUpCount } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [replies, pendingAudits, followUps] = await Promise.all([
    getRecentReplies(30),
    getPendingAuditsCount(),
    getFollowUpCount(),
  ]);
  return (
    <div className="min-h-screen">
      <AutoRefresh />
      <Sidebar />
      <div className="md:pl-[248px]">
        <Header
          canLogout={authEnabled()}
          pendingAudits={pendingAudits}
          followUps={followUps}
          replies={replies}
        />
        <main className="mx-auto max-w-[1280px] px-4 pb-28 pt-6 md:px-8 md:pb-12">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
