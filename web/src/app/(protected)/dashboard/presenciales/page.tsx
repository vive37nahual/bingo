"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { RefreshButton } from "@/components/ui/RefreshButton";

interface PresencialRow {
  comprador: string;
  cantidad: number;
  cartones: string;
}

export default function PresencialesPage() {
  const { token } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(["presenciales", token], () =>
    apiCall<PresencialRow[]>("getPresenciales", {}, token)
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Presenciales — Entrega de cartones</h1>
        <RefreshButton onRefresh={() => mutate()} loading={isLoading} />
      </div>

      <SectionLoader loading={isLoading}>
        {error && (
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Error"}
          </p>
        )}
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-3">Comprador</th>
                <th className="p-3">Cantidad</th>
                <th className="p-3">Cartones</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="p-3 font-medium">{row.comprador}</td>
                  <td className="p-3">{row.cantidad}</td>
                  <td className="p-3 font-mono">{row.cartones}</td>
                </tr>
              ))}
              {data?.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500">
                    No hay entregas presenciales completadas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionLoader>
    </div>
  );
}
