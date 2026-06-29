"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiCall, formatColones } from "@/lib/api";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { RefreshButton } from "@/components/ui/RefreshButton";

export default function PreciosPage() {
  const { token } = useAuth();
  const [precios, setPrecios] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiCall<Record<string, number>>(
        "getPrecios",
        {},
        token
      );
      setPrecios(data);
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className="flex items-center gap-3 rounded-lg border bg-white p-3"
            >
              <span className="w-24 text-sm font-medium">{n} cartón(es)</span>
              <input
                type="number"
                min={0}
                value={precios[String(n)] ?? precios[n] ?? 0}
                onChange={(e) =>
                  setPrecios({ ...precios, [String(n)]: Number(e.target.value) })
                }
                className="flex-1 rounded border px-2 py-1 text-sm"
              />
              <span className="text-xs text-gray-500">
                {formatColones(precios[String(n)] ?? 0)}
              </span>
            </div>
          ))}
        </div>

        {message && (
          <p className="mt-4 text-sm text-green-700">{message}</p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-6 rounded-lg bg-amber-600 px-6 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Precios"}
        </button>
      </SectionLoader>
    </div>
  );
}
