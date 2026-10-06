import { Container } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PropertyDetailLoading() {
  return (
    <div className="py-8 md:py-12 bg-casa-canvas text-start">
      <Container>
        {/* Breadcrumb Skeleton */}
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
            <div className="grid grid-cols-4 gap-2">
              <Skeleton className="aspect-[16/10] rounded-xl" />
              <Skeleton className="aspect-[16/10] rounded-xl" />
              <Skeleton className="aspect-[16/10] rounded-xl" />
              <Skeleton className="aspect-[16/10] rounded-xl" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </Container>
    </div>
  );
}
