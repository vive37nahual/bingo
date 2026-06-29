"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";
import type { Entrada, PaginatedResponse } from "@/lib/types";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { EntradaCard } from "@/components/ventas/EntradaCard";

const PAGE_SIZES = [5, 10, 20, 30, 40, 50];

export default function PendientesPage() {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const { data, error, isLoading, mutate } = useSWR(
    ["pendientes", page, pageSize, token],
    () =>
      apiCall<PaginatedResponse<Entrada>>(
        "getEntradasPendientes",
        { page, pageSize },
        token
      )
  );

  const handleAction = async (
    entradaId: number,
    action: "approveEntrada" | "rejectEntrada"
  ) => {
    setActionLoading(entradaId);
    try {
      await apiCall(action, { entradaId }, token);
      await mutate();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">BINGO Ventas — Pendientes</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm">
            Por página:{" "}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded border px-2 py-1"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <RefreshButton onRefresh={() => mutate()} loading={isLoading} />
        </div>
      </div>

      <SectionLoader loading={isLoading}>
        {error && (
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Error"}
          </p>
        )}
        <div className="space-y-4">
          {data?.items.map((entrada) => (
            <EntradaCard
              key={entrada.entradaID}
              entrada={entrada}
              variant="pendientes"
              loading={actionLoading === entrada.entradaID}
              onApprove={() => handleAction(entrada.entradaID, "approveEntrada")}
              onReject={() => handleAction(entrada.entradaID, "rejectEntrada")}
            />
          ))}
          {data?.items.length === 0 && (
            <p className="text-center text-gray-500">No hay entradas pendientes</p>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm">
              {page} / {data.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </SectionLoader>
    </div>
  );
}
