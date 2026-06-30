"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Modal } from "@/components/ui/Modal";
import {
  useUnsavedChanges,
  useUnsavedChangesContext,
} from "@/components/ui/UnsavedChanges";

const TEMPLATE_KEYS = [
  { key: "email_virtual", label: "Email — Virtual", type: "html" },
  { key: "email_presencial", label: "Email — Presencial", type: "html" },
  { key: "whatsapp_virtual", label: "WhatsApp — Virtual", type: "whatsapp" },
  {
    key: "whatsapp_presencial",
    label: "WhatsApp — Presencial",
    type: "whatsapp",
  },
] as const;

export default function NotificacionesAdminPage() {
  const { token } = useAuth();
  const { markSaved } = useUnsavedChangesContext();
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [savedTemplates, setSavedTemplates] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<{
    title: string;
    content: string;
    type: string;
  } | null>(null);
  const [message, setMessage] = useState("");

  const isDirty = useMemo(
    () => JSON.stringify(templates) !== JSON.stringify(savedTemplates),
    [templates, savedTemplates]
  );
  useUnsavedChanges(isDirty);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiCall<Record<string, string>>(
        "getNotificaciones",
        {},
        token
      );
      setTemplates(data);
      setSavedTemplates(data);
      markSaved();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const save = async () => {
    setSaving(true);
    try {
      await apiCall("saveNotificaciones", { templates }, token);
      setSavedTemplates({ ...templates });
      markSaved();
      setMessage("Plantillas guardadas");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const previewTemplate = async (key: string, type: string, label: string) => {
    try {
      const content = await apiCall<string>(
        "previewNotification",
        { templateKey: key },
        token
      );
      setPreview({ title: label, content, type });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">BINGO Admin — Notificaciones</h1>
        <RefreshButton onRefresh={load} loading={loading} />
      </div>

      <p className="mb-4 text-sm text-gray-600">
        Variables: {"{{nombre}}"}, {"{{numcartones}}"}, {"{{pago}}"},
        {" {{linkcartones}}"}, {"{{pdfscartones}}"}, {"{{email}}"},
        {" {{proofDriveUrl}}"}
      </p>

      <SectionLoader loading={loading}>
        {isDirty && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Tiene cambios sin guardar. Guarde antes de salir de esta página.
          </p>
        )}

        <div className="space-y-6">
          {TEMPLATE_KEYS.map(({ key, label, type }) => (
            <div key={key} className="rounded-xl border bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{label}</h3>
                <button
                  type="button"
                  onClick={() => previewTemplate(key, type, label)}
                  className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Vista previa
                </button>
              </div>
              <textarea
                rows={type === "html" ? 8 : 5}
                value={templates[key] || ""}
                onChange={(e) =>
                  setTemplates({ ...templates, [key]: e.target.value })
                }
                className="w-full rounded border p-3 font-mono text-sm"
              />
            </div>
          ))}
        </div>

        {message && <p className="mt-4 text-sm text-green-700">{message}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving || !isDirty}
          className="mt-6 rounded-lg bg-amber-600 px-6 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Plantillas"}
        </button>
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
          <div className="mx-auto max-w-sm">
            <div className="rounded-2xl bg-[#e5ddd5] p-4">
              <div className="ml-auto max-w-[85%] rounded-lg bg-[#dcf8c6] p-3 text-sm shadow">
                <pre className="whitespace-pre-wrap font-sans">
                  {preview?.content}
                </pre>
                <p className="mt-1 text-right text-[10px] text-gray-500">
                  12:00 ✓✓
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
