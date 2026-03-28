import { TerminalLoader, Shimmer } from "@/components/ui/LoadingState";

export default function FreebiesLoading() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between mt-2 mb-2">
        <TerminalLoader text="FETCHING FREEBIES DATA" />
      </div>

      {/* FILTER BAR SKELETON */}
      <Shimmer className="h-32 w-full" />

      {/* GRID SKELETON */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
        {[1,2,3,4,5,6,7,8].map(i => (
          <Shimmer key={i} className="h-64 w-full" />
        ))}
      </div>
    </div>
  );
}
