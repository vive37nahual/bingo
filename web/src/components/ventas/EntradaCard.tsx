"use client";

import { Copy, ExternalLink } from "lucide-react";
import type { Entrada } from "@/lib/types";
import { copyToClipboard, formatColones } from "@/lib/api";

interface EntradaCardProps {
  entrada: Entrada;
  variant: "pendientes" | "notificaciones" | "historial";
  onApprove?: () => void;
  onReject?: () => void;
  onEmailPreview?: () => void;
  onSendEmail?: () => void;
  onWhatsAppPreview?: () => void;
  onSendWhatsApp?: () => void;
  onCopyWhatsApp?: () => void;
  onConfirmWhatsApp?: () => void;
  onReturn?: () => void;
  onResendEmail?: () => void;
  onResendWhatsApp?: () => void;
  onReturnHistorial?: () => void;
  loading?: boolean;
}

export function EntradaCard({
  entrada,
  variant,
  onApprove,
  onReject,
  onEmailPreview,
  onSendEmail,
  onWhatsAppPreview,
  onSendWhatsApp,
  onCopyWhatsApp,
  onConfirmWhatsApp,
  onReturn,
  onResendEmail,
  onResendWhatsApp,
  onReturnHistorial,
  loading,
}: EntradaCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {entrada.notaRegreso && (
        <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">
          {entrada.notaRegreso}
        </p>
      )}

      <h3 className="text-lg font-semibold text-gray-900">
        {entrada.nombre} {entrada.apellido}
      </h3>
      <p className="text-sm text-gray-600">{entrada.correo}</p>
      {entrada.notifyWhatsApp && entrada.numWA && (
        <p className="text-sm text-gray-600">{entrada.numWA}</p>
      )}

      <div className="mt-3 space-y-1 text-sm text-gray-700">
        <p>Monto a pagar: {formatColones(entrada.monto)}</p>
        <p>
          Modalidad: {entrada.modalidad} — Cantidad: {entrada.cantidad} —
          Vendedor: {entrada.vendedor}
        </p>
        <p>ID de Compra: {entrada.entradaID}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {entrada.comprobante && (
          <a
            href={entrada.comprobante}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            <ExternalLink className="h-4 w-4" />
            Comprobante{variant === "pendientes" ? " Drive" : ""}
          </a>
        )}

        {variant === "pendientes" && (
          <>
            <button
              type="button"
              onClick={onApprove}
              disabled={loading}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Aprobar
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={loading}
              className="rounded-lg bg-gray-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              Rechazar
            </button>
          </>
        )}

        {variant === "notificaciones" && (
          <>
            <button
              type="button"
              onClick={onEmailPreview}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Email Preview
            </button>
            <button
              type="button"
              onClick={onSendEmail}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Enviar Email
            </button>
            {entrada.notifyWhatsApp && (
              <>
                <button
                  type="button"
                  onClick={onWhatsAppPreview}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  WhatsApp Preview
                </button>
                <div className="inline-flex overflow-hidden rounded-lg border">
                  <button
                    type="button"
                    onClick={onSendWhatsApp}
                    disabled={loading}
                    className="bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Enviar WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={onCopyWhatsApp}
                    className="border-l bg-green-50 px-2 hover:bg-green-100"
                    title="Copiar link"
                  >
                    <Copy className="h-4 w-4 text-green-700" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onConfirmWhatsApp}
                  disabled={loading}
                  className="rounded-lg border border-green-600 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50"
                >
                  Confirmar WhatsApp
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onReturn}
              disabled={loading}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              Regresar
            </button>
          </>
        )}

        {variant === "historial" && (
          <>
            <button
              type="button"
              onClick={onResendEmail}
              disabled={loading}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Reenviar Email
            </button>
            {entrada.notifyWhatsApp && (
              <div className="inline-flex overflow-hidden rounded-lg border">
                <button
                  type="button"
                  onClick={onResendWhatsApp}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Reenviar WhatsApp
                </button>
                <button
                  type="button"
                  onClick={onCopyWhatsApp}
                  className="border-l px-2 hover:bg-gray-100"
                  title="Copiar link"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            )}
            {!entrada.myfreebingoListo && (
              <button
                type="button"
                onClick={onReturnHistorial}
                disabled={loading}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                Regresar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export async function handleCopyWhatsApp(
  getUrl: () => Promise<{ url: string }>
) {
  const { url } = await getUrl();
  await copyToClipboard(url);
}
