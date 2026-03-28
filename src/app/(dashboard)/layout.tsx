import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/Toast";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { ShortcutHints } from "@/components/ui/ShortcutHints";
import { BottomNav } from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 min-w-0 relative">
        <Header />
        <main className="flex-[1_1_0%] overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-[90px] md:pb-6 relative w-full">
          {children}
        </main>
      </div>
      <Toaster />
      <CommandPalette />
      <ShortcutHints />
      <BottomNav />
    </div>
  );
}
