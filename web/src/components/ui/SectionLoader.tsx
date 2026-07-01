"use client";

export function SectionLoader({
  loading,
  message = "Cargando...",
  children,
}: {
  loading: boolean;
  message?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[200px]">
      <div
        className={`transition-opacity duration-300 ${
          loading ? "pointer-events-none opacity-40" : "opacity-100"
        }`}
      >
        {children}
      </div>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/60 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            <span className="text-sm font-medium text-gray-700">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
