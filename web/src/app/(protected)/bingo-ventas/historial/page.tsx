"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/auth";
import { apiCall, copyToClipboard, downloadCSV, formatColones } from "@/lib/api";
import type { Entrada, PaginatedResponse } from "@/lib/types";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { EntradaCard } from "@/components/ventas/EntradaCard";

export default function HistorialPage() {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const { data, error, isLoading, mutate } = useSWR(
    ["historial", page, pageSize, token],
    () =>
      apiCall<PaginatedResponse<Entrada>>(
        "getHistorial",
        { page, pageSize },
        token
      )
  );

  const exportCSV = async () => {
    const result = await apiCall<{ csv: string }>("exportHistorialCSV", {}, token);
    downloadCSV(result.csv, "historial-ventas.csv");
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">BINGO Ventas — Historial</h1>
        <div className="flex gap-2">
          <RefreshButton onRefresh={() => mutate()} loading={isLoading} />
          <button
            type="button"
            onClick={exportCSV}
            className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <SectionLoader loading={isLoading}>
        {error && (
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Error"}
          </p>
        )}

        <div className="mb-6 overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">ID</th>
                <th className="p-3">Comprador</th>
                <th className="p-3">Email</th>
                <th className="p-3">Monto</th>
                <th className="p-3">Cantidad</th>
                <th className="p-3">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((e) => (
                <tr key={e.entradaID} className="border-b">
                  <td className="p-3 text-xs">
                    {e.fechaCompletada
                      ? new Date(e.fechaCompletada).toLocaleString("es-CR")
                      : "—"}
                  </td>
                  <td className="p-3">{e.entradaID}</td>
                  <td className="p-3">
                    {e.nombre} {e.apellido}
                  </td>
                  <td className="p-3">{e.correo}</td>
                  <td className="p-3">{formatColones(e.monto)}</td>
                  <td className="p-3">{e.cantidad}</td>
                  <td className="p-3">{e.notifyWhatsApp ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700">Acciones por entrada</h2>
          {data?.items.map((entrada) => (
            <EntradaCard
              key={entrada.entradaID}
              entrada={entrada}
              variant="historial"
              loading={actionLoading === entrada.entradaID}
              onResendEmail={async () => {
                setActionLoading(entrada.entradaID);
                try {
                  await apiCall(
                    "resendEmail",
                    { entradaId: entrada.entradaID },
                    token
                  );
                } finally {
                  setActionLoading(null);
                }
              }}
              onResendWhatsApp={async () => {
                const { url } = await apiCall<{ url: string }>(
                  "getWhatsAppUrlHistorial",
                  { entradaId: entrada.entradaID },
                  token
                );
                window.open(url, "_blank");
              }}
              onCopyWhatsApp={async () => {
                const { url } = await apiCall<{ url: string }>(
                  "getWhatsAppUrlHistorial",
                  { entradaId: entrada.entradaID },
                  token
                );
                await copyToClipboard(url);
              }}
              onReturnHistorial={async () => {
                setActionLoading(entrada.entradaID);
                try {
                  await apiCall(
                    "returnFromHistorial",
                    { entradaId: entrada.entradaID },
                    token
                  );
                  await mutate();
                } finally {
                  setActionLoading(null);
                }
              }}
            />
          ))}
        </div>
      </SectionLoader>
    </div>
  );
}
