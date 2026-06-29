"use client";

import useSWR from "swr";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiCall, copyToClipboard, MYFREE_BINGO_URL } from "@/lib/api";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { RefreshButton } from "@/components/ui/RefreshButton";

interface MyFreeBingoItem {
  entradaID: number;
  email: string;
  cantidad: number;
  cartones: string;
  listo: boolean;
}

export default function MyFreeBingoCardsPage() {
  const { token } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    ["myfreebingo", token],
    () => apiCall<MyFreeBingoItem[]>("getMyFreeBingoList", {}, token)
  );

  const markListo = async (entradaId: number) => {
    await apiCall("markMyFreeBingoListo", { entradaId }, token);
    await mutate();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">MyFreeBingoCards</h1>
        <div className="flex gap-2">
          <RefreshButton onRefresh={() => mutate()} loading={isLoading} />
          <a
            href={MYFREE_BINGO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            <ExternalLink className="h-4 w-4" /> Abrir MyFreeBingoCards
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
                  <th className="p-3">Email</th>
                  <th className="p-3">Cantidad</th>
                  <th className="p-3">Cartones</th>
                  <th className="p-3">Listo</th>
                </tr>
              </thead>
              <tbody>
                {(data || []).map((item) => (
                  <tr key={item.entradaID} className="border-b">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{item.email}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.email)}
                          className="shrink-0 rounded border p-1 hover:bg-gray-50"
                          title="Copiar email"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3">{item.cantidad}</td>
                    <td className="p-3 font-mono text-xs">{item.cartones}</td>
                    <td className="p-3">
                      {item.listo ? (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-green-100 text-green-700">
                          <Check className="h-5 w-5" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markListo(item.entradaID)}
                          className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                        >
                          Listo
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.length === 0 && (
              <p className="p-6 text-center text-gray-500">
                No hay compras virtuales pendientes de ingreso
              </p>
            )}
          </div>
        </SectionLoader>

        <div className="rounded-xl border bg-white shadow-sm">
          <iframe
            src={MYFREE_BINGO_URL}
            title="MyFreeBingoCards"
            className="w-full rounded-xl"
            style={{ height: 1200 }}
          />
        </div>
      </div>
    </div>
  );
}
