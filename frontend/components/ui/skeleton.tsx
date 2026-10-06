import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-casa-subtle/80 dark:bg-gray-800',
        className,
      )}
      {...props}
    />
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="bg-casa-surface border border-casa-border-light rounded-2xl shadow-subtle overflow-hidden flex flex-col p-0">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-40" />
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-casa-border-light">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>
    </div>
  );
}
