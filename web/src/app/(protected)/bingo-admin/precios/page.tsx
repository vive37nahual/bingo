"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiCall, formatColones } from "@/lib/api";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import {
  useUnsavedChanges,
  useUnsavedChangesContext,
} from "@/components/ui/UnsavedChanges";

export default function PreciosPage() {
  const { token } = useAuth();
  const { markSaved } = useUnsavedChangesContext();
  const [precios, setPrecios] = useState<Record<string, number>>({});
  const [savedPrecios, setSavedPrecios] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isDirty = useMemo(
    () => JSON.stringify(precios) !== JSON.stringify(savedPrecios),
    [precios, savedPrecios]
  );
  useUnsavedChanges(isDirty);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiCall<Record<string, number>>(
        "getPrecios",
        {},
        token
      );
      setPrecios(data);
      setSavedPrecios(data);
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
    setMessage("");
    try {
      await apiCall("savePrecios", { precios }, token);
      setSavedPrecios({ ...precios });
      markSaved();
      setMessage("Precios guardados correctamente");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">BINGO Admin — Precios</h1>
        <RefreshButton onRefresh={load} loading={loading} />
      </div>

      <SectionLoader loading={loading}>
        <p className="mb-4 text-sm text-gray-600">
          Configure el precio para cada cantidad de cartones (1 a 20). Los
          cambios solo afectan nuevas compras en el formulario.
        </p>

        {isDirty && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Tiene cambios sin guardar. Guarde antes de salir de esta página.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className="flex flex-col rounded-lg border bg-white p-3"
            >
              <span className="mb-2 text-sm font-medium text-gray-800">
                {n} cartón(es)
              </span>
              <input
                type="number"
                min={0}
                value={precios[String(n)] ?? precios[n] ?? 0}
                onChange={(e) =>
                  setPrecios({
                    ...precios,
                    [String(n)]: Number(e.target.value),
                  })
                }
                className="w-full rounded border px-2 py-1.5 text-sm"
              />
              <span className="mt-2 text-center text-sm font-semibold text-amber-700">
                {formatColones(precios[String(n)] ?? 0)}
              </span>
            </div>
          ))}
        </div>

        {message && (
          <p
            className={`mt-4 text-sm ${message.includes("correctamente") ? "text-green-700" : "text-red-600"}`}
          >
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving || !isDirty}
          className="mt-6 rounded-lg bg-amber-600 px-6 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Precios"}
        </button>
      </SectionLoader>
    </div>
  );
}
