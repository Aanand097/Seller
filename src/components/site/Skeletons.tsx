import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder that mirrors ProductCard's exact structure (no layout shift on swap). */
export function ProductCardSkeleton() {
  return (
    <div className="h-full rounded-2xl border bg-card overflow-hidden">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
        </div>
        <div className="space-y-3 pt-3 border-t">
          <Skeleton className="h-9 w-full rounded-md" />
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Catalog grid placeholder. */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </>
  );
}

/** Category tiles placeholder matching the home page tile size. */
export function CategoryTilesSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card p-5 text-center">
          <Skeleton className="h-12 w-12 mx-auto rounded-xl mb-3" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
      ))}
    </>
  );
}

/** Sidebar cards on the product detail page (warranty + delivery/support). */
export function ProductSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-2">
            <Skeleton className="h-4 w-4 rounded-full shrink-0" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full product detail placeholder: gallery, info column and sidebar. */
export function ProductDetailSkeleton() {
  return (
    <>
      <div className="border-b bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-3 flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <section className="container mx-auto max-w-7xl px-4 py-6">
        <div className="grid lg:grid-cols-[minmax(0,420px)_1fr_320px] gap-6">
          <div className="space-y-3">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-16 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-4/5" />
            <Skeleton className="h-5 w-40" />
            <div className="rounded-2xl border bg-card p-5 space-y-3">
              <Skeleton className="h-10 w-44" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <ProductSidebarSkeleton />
        </div>
      </section>
    </>
  );
}