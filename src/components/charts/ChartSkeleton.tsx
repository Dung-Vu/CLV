import { Shimmer } from "@/components/ui/LoadingState";

export function ChartSkeleton() {
  return (
    <div className="w-full h-full min-h-[220px] flex items-center justify-center p-4">
      <Shimmer className="w-full h-full opacity-30" />
    </div>
  );
}
