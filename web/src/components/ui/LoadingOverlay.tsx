"use client";

import { useEffect } from "react";

export function LoadingOverlay({
  active,
  message = "Procesando, por favor espere...",
}: {
  active: boolean;
  message?: string;
}) {
  useEffect(() => {
    if (!active) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm"
      role="alertdialog"
      aria-busy="true"
      aria-live="assertive"
    >
      <div className="mx-4 flex max-w-sm flex-col items-center gap-4 rounded-2xl bg-white px-8 py-7 shadow-2xl">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-center text-sm font-semibold text-gray-800">{message}</p>
        <p className="text-center text-xs text-gray-500">
          No cierre ni abandone esta página hasta que finalice.
        </p>
      </div>
    </div>
  );
}
