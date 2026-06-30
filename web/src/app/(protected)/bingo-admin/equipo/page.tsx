"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import {
  useUnsavedChanges,
  useUnsavedChangesContext,
} from "@/components/ui/UnsavedChanges";
import { Plus, Trash2 } from "lucide-react";

interface Miembro {
  id: number;
  nombre: string;
  activo: boolean;
}

export default function EquipoPage() {
  const { token } = useAuth();
  const { markSaved } = useUnsavedChangesContext();
  const [equipo, setEquipo] = useState<Miembro[]>([]);
  const [savedEquipo, setSavedEquipo] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isDirty = useMemo(
    () => JSON.stringify(equipo) !== JSON.stringify(savedEquipo),
    [equipo, savedEquipo]
  );
  useUnsavedChanges(isDirty);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiCall<Miembro[]>("getEquipo", {}, token);
      const normalized = data.map((m) => ({
        ...m,
        activo: m.activo === true || String(m.activo).toUpperCase() === "TRUE",
      }));
      setEquipo(normalized);
      setSavedEquipo(normalized);
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
      await apiCall("saveEquipo", { equipo }, token);
      setSavedEquipo([...equipo]);
      markSaved();
      setMessage("Equipo actualizado");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const addMember = () => {
    setEquipo([...equipo, { id: equipo.length + 1, nombre: "", activo: true }]);
  };

  const removeMember = (idx: number) => {
    setEquipo(equipo.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">BINGO Admin — Equipo</h1>
        <RefreshButton onRefresh={load} loading={loading} />
      </div>

      <SectionLoader loading={loading}>
        {isDirty && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Tiene cambios sin guardar. Guarde antes de salir de esta página.
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {equipo.map((m, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-lg border bg-white p-3"
            >
              <input
                value={m.nombre}
                onChange={(e) => {
                  const updated = [...equipo];
                  updated[idx] = { ...m, nombre: e.target.value };
                  setEquipo(updated);
                }}
                placeholder="Nombre del vendedor"
                className="flex-1 rounded border px-2 py-1.5 text-sm"
              />
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={m.activo}
                  onChange={(e) => {
                    const updated = [...equipo];
                    updated[idx] = { ...m, activo: e.target.checked };
                    setEquipo(updated);
                  }}
                />
                Activo
              </label>
              <button
                type="button"
                onClick={() => removeMember(idx)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addMember}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" /> Agregar miembro
        </button>

        {message && (
          <p className="mt-4 text-sm text-green-700">{message}</p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving || !isDirty}
          className="mt-4 rounded-lg bg-amber-600 px-6 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Equipo"}
        </button>
      </SectionLoader>
    </div>
  );
}
