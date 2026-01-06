import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingUitgaven() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-5 w-48" />
        {[1, 2, 3, 4, 5].map((key) => (
          <Skeleton key={key} className="mt-2 h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

