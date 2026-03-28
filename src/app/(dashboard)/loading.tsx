import { TerminalLoader, Shimmer } from "@/components/ui/LoadingState";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10 animate-in fade-in duration-500">
      
      <div className="flex items-center mb-2">
        <TerminalLoader text="INITIALIZING COMMAND CENTER" />
      </div>

      {/* PANEL 1: SYSTEM STATUS SKELETON */}
      <Shimmer className="h-[76px] w-full" />

      {/* PANEL 2: QUICK STATS SKELETON */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <Shimmer key={i} className="h-28 w-full" />
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL 3 SKELETON */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <TerminalLoader text="LOADING RECENT DEALS" />
          <Shimmer className="h-[400px] w-full" />
        </div>

        {/* PANEL 4 SKELETON */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <TerminalLoader text="LOADING ACTIONS" />
          <Shimmer className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
