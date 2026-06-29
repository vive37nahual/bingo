"use client";

export function SectionLoader({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[200px]">
      {children}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            <span className="text-sm font-medium text-gray-600">Cargando...</span>
          </div>
        </div>
      )}
    </div>
  );
}
