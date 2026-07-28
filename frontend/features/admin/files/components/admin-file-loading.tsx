export function AdminFileLoading() {
  return (
    <div className="grid gap-4" aria-label="Đang tải dữ liệu file">
      <div className="grid grid-cols-5 gap-4 max-2xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="h-32 animate-pulse rounded-lg border border-brand-line bg-slate-50" key={index} />
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-4 max-xl:grid-cols-1">
        <div className="h-[520px] animate-pulse rounded-lg border border-brand-line bg-slate-50" />
        <div className="grid gap-4">
          <div className="h-64 animate-pulse rounded-lg border border-brand-line bg-slate-50" />
          <div className="h-64 animate-pulse rounded-lg border border-brand-line bg-slate-50" />
        </div>
      </div>
    </div>
  );
}
