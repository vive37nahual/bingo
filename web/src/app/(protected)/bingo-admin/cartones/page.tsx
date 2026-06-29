"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiCall, downloadCSV } from "@/lib/api";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Download, Upload } from "lucide-react";

interface Carton {
  numero: string;
  linkJuego: string;
  linkPDF: string;
  estado: string;
  entradaID: string;
  comprador: string;
  vendedor: string;
}

export default function CartonesPage() {
  const { token } = useAuth();
  const [cartones, setCartones] = useState<Carton[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiCall<Carton[]>("getCartones", {}, token);
      setCartones(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const downloadTemplate = async () => {
    const result = await apiCall<{ csv: string }>("getCartonesTemplate", {}, token);
    downloadCSV(result.csv, "plantilla-cartones.csv");
  };

  const exportExisting = async () => {
    const result = await apiCall<{ csv: string }>("exportCartones", {}, token);
    downloadCSV(result.csv, "cartones-existentes.csv");
  };

  const importCSV = async (file: File, append: boolean) => {
    const text = await file.text();
    try {
      const result = await apiCall<{ message: string; total: number }>(
        "importCartones",
        { csv: text, append },
        token
      );
      setMessage(`${result.message} — Total: ${result.total}`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    }
  };

  const disponibles = cartones.filter((c) => c.estado === "Disponible").length;
  const asignados = cartones.filter((c) => c.estado === "Asignado").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">BINGO Admin — Cartones</h1>
        <RefreshButton onRefresh={load} loading={loading} />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          <Download className="h-4 w-4" /> Descargar plantilla
        </button>
        <button
          type="button"
          onClick={exportExisting}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          <Download className="h-4 w-4" /> Descargar existentes
        </button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
          <Upload className="h-4 w-4" /> Importar (reemplazar)
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCSV(f, false);
            }}
          />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
          <Upload className="h-4 w-4" /> Importar (agregar)
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCSV(f, true);
            }}
          />
        </label>
      </div>

      {message && <p className="mb-4 text-sm text-green-700">{message}</p>}

      <div className="mb-4 flex gap-4 text-sm">
        <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">
          Disponibles: {disponibles}
        </span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
          Asignados: {asignados}
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-800">
          Total: {cartones.length}
        </span>
      </div>

      <SectionLoader loading={loading}>
        <div className="max-h-[500px] overflow-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 border-b bg-gray-50">
              <tr>
                <th className="p-2">N.°</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Comprador</th>
                <th className="p-2">Vendedor</th>
                <th className="p-2">ID Compra</th>
              </tr>
            </thead>
            <tbody>
              {cartones.slice(0, 100).map((c) => (
                <tr key={c.numero} className="border-b">
                  <td className="p-2 font-mono">{c.numero}</td>
                  <td className="p-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        c.estado === "Disponible"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.estado}
                    </span>
                  </td>
                  <td className="p-2">{c.comprador || "—"}</td>
                  <td className="p-2">{c.vendedor || "—"}</td>
                  <td className="p-2">{c.entradaID || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {cartones.length > 100 && (
            <p className="p-3 text-center text-xs text-gray-500">
              Mostrando primeros 100 de {cartones.length}
            </p>
          )}
        </div>
      </SectionLoader>
    </div>
  );
}
