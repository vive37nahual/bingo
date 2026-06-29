"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/auth";
import { apiCall, copyToClipboard } from "@/lib/api";
import type { Entrada, PaginatedResponse } from "@/lib/types";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Modal } from "@/components/ui/Modal";
import { EntradaCard } from "@/components/ventas/EntradaCard";

export default function NotificacionesVentasPage() {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [preview, setPreview] = useState<{
    title: string;
    content: string;
    type: "html" | "whatsapp";
  } | null>(null);

  const { data, error, isLoading, mutate } = useSWR(
    ["notificaciones", page, pageSize, token],
    () =>
      apiCall<PaginatedResponse<Entrada>>(
        "getEntradasNotificaciones",
        { page, pageSize },
        token
      )
  );

  const withLoading = async (entradaId: number, fn: () => Promise<void>) => {
    setActionLoading(entradaId);
    try {
      await fn();
      await mutate();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">BINGO Ventas — Notificaciones</h1>
        <RefreshButton onRefresh={() => mutate()} loading={isLoading} />
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
              variant="notificaciones"
              loading={actionLoading === entrada.entradaID}
              onEmailPreview={async () => {
                const html = await apiCall<string>(
                  "getEmailPreview",
                  { entradaId: entrada.entradaID },
                  token
                );
                setPreview({ title: "Vista previa Email", content: html, type: "html" });
              }}
              onSendEmail={() =>
                withLoading(entrada.entradaID, () =>
                  apiCall("sendEmail", { entradaId: entrada.entradaID }, token).then(
                    () => undefined
                  )
                )
              }
              onWhatsAppPreview={async () => {
                const result = await apiCall<{ message: string }>(
                  "getWhatsAppPreview",
                  { entradaId: entrada.entradaID },
                  token
                );
                setPreview({
                  title: "Vista previa WhatsApp",
                  content: result.message,
                  type: "whatsapp",
                });
              }}
              onSendWhatsApp={async () => {
                const { url } = await apiCall<{ url: string }>(
                  "getWhatsAppUrl",
                  { entradaId: entrada.entradaID },
                  token
                );
                window.open(url, "_blank");
              }}
              onCopyWhatsApp={async () => {
                const { url } = await apiCall<{ url: string }>(
                  "getWhatsAppUrl",
                  { entradaId: entrada.entradaID },
                  token
                );
                await copyToClipboard(url);
              }}
              onConfirmWhatsApp={() =>
                withLoading(entrada.entradaID, () =>
                  apiCall(
                    "confirmWhatsApp",
                    { entradaId: entrada.entradaID },
                    token
                  ).then(() => undefined)
                )
              }
              onReturn={() =>
                withLoading(entrada.entradaID, () =>
                  apiCall(
                    "returnToPendientes",
                    { entradaId: entrada.entradaID },
                    token
                  ).then(() => undefined)
                )
              }
            />
          ))}
          {data?.items.length === 0 && (
            <p className="text-center text-gray-500">
              No hay entradas en cola de notificación
            </p>
          )}
        </div>
      </SectionLoader>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.title || ""}
        wide
      >
        {preview?.type === "html" ? (
          <div
            className="prose max-w-none rounded border p-4"
            dangerouslySetInnerHTML={{ __html: preview.content }}
          />
        ) : (
          <div className="mx-auto max-w-sm rounded-2xl bg-[#e5ddd5] p-4">
            <div className="ml-auto max-w-[85%] rounded-lg bg-[#dcf8c6] p-3 text-sm">
              <pre className="whitespace-pre-wrap font-sans">{preview?.content}</pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
