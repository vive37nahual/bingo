"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/auth";
import { apiCall, copyToClipboard } from "@/lib/api";
import type { Entrada, PaginatedResponse } from "@/lib/types";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Modal } from "@/components/ui/Modal";
import { EntradaCard } from "@/components/ventas/EntradaCard";

export default function NotificacionesVentasPage() {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState("Procesando...");
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

  const withLoading = async (
    entradaId: number,
    message: string,
    fn: () => Promise<void>
  ) => {
    setActionMessage(message);
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
      <LoadingOverlay active={actionLoading !== null} message={actionMessage} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">BINGO Ventas — Notificaciones</h1>
        <RefreshButton
          onRefresh={() => mutate()}
          loading={isLoading || actionLoading !== null}
        />
      </div>

      <SectionLoader loading={isLoading} message="Cargando notificaciones...">
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
              loadingLabel="Procesando..."
              onEmailPreview={async () => {
                setActionMessage("Generando vista previa del correo...");
                setActionLoading(entrada.entradaID);
                try {
                  const html = await apiCall<string>(
                    "getEmailPreview",
                    { entradaId: entrada.entradaID },
                    token
                  );
                  setPreview({
                    title: "Vista previa Email",
                    content: html,
                    type: "html",
                  });
                } finally {
                  setActionLoading(null);
                }
              }}
              onSendEmail={() =>
                withLoading(entrada.entradaID, "Enviando correo de confirmación...", () =>
                  apiCall("sendEmail", { entradaId: entrada.entradaID }, token).then(
                    () => undefined
                  )
                )
              }
              onWhatsAppPreview={async () => {
                setActionMessage("Generando vista previa de WhatsApp...");
                setActionLoading(entrada.entradaID);
                try {
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
                } finally {
                  setActionLoading(null);
                }
              }}
              onSendWhatsApp={async () => {
                setActionMessage("Preparando enlace de WhatsApp...");
                setActionLoading(entrada.entradaID);
                try {
                  const { url } = await apiCall<{ url: string }>(
                    "getWhatsAppUrl",
                    { entradaId: entrada.entradaID },
                    token
                  );
                  window.open(url, "_blank");
                } finally {
                  setActionLoading(null);
                }
              }}
              onCopyWhatsApp={async () => {
                setActionMessage("Copiando enlace de WhatsApp...");
                setActionLoading(entrada.entradaID);
                try {
                  const { url } = await apiCall<{ url: string }>(
                    "getWhatsAppUrl",
                    { entradaId: entrada.entradaID },
                    token
                  );
                  await copyToClipboard(url);
                } finally {
                  setActionLoading(null);
                }
              }}
              onConfirmWhatsApp={() =>
                withLoading(
                  entrada.entradaID,
                  "Confirmando envío de WhatsApp...",
                  () =>
                    apiCall(
                      "confirmWhatsApp",
                      { entradaId: entrada.entradaID },
                      token
                    ).then(() => undefined)
                )
              }
              onReturn={() =>
                withLoading(
                  entrada.entradaID,
                  "Regresando entrada a pendientes...",
                  () =>
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
