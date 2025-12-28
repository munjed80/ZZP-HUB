import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingFacturen() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <Skeleton className="h-5 w-40" />
        {[1, 2, 3, 4].map((key) => (
          <Skeleton key={key} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

