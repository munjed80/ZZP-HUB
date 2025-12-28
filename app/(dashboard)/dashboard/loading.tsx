import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingDashboard() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-56" />
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

