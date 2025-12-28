import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingRelaties() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <Skeleton className="h-5 w-48" />
        {[1, 2, 3, 4].map((key) => (
          <Skeleton key={key} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

