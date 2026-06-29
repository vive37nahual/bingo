"use client";

import useSWR from "swr";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/lib/auth";
import { apiCall, downloadCSV, formatColones } from "@/lib/api";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { useState } from "react";

const COLORS = ["#d97706", "#ea580c", "#f59e0b", "#fb923c", "#fdba74", "#fcd34d"];

interface DashboardData {
  kpis: {
    ventasAprobadas: number;
    cartonesVendidos: number;
    montoRecaudado: number;
  };
  charts: {
    cantidadPorVendedor: { name: string; value: number }[];
    montoPorVendedor: { name: string; value: number }[];
  };
  tabla: {
    comprador: string;
    modalidad: string;
    cantidad: number;
    precioPagado: number;
    vendedor: string;
  }[];
  vendedores: string[];
}

export default function DashboardBingoPage() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({
    vendedor: "",
    cantidadMin: "",
    cantidadMax: "",
    montoMin: "",
    montoMax: "",
    includeNonApproved: false,
  });

  const { data, error, isLoading, mutate } = useSWR(
    ["dashboard", filters, token],
    () =>
      apiCall<DashboardData>(
        "getDashboard",
        {
          filters: {
            vendedor: filters.vendedor || undefined,
            cantidadMin: filters.cantidadMin || undefined,
            cantidadMax: filters.cantidadMax || undefined,
            montoMin: filters.montoMin || undefined,
            montoMax: filters.montoMax || undefined,
            includeNonApproved: filters.includeNonApproved,
          },
        },
        token
      )
  );

  const exportCSV = async () => {
    const result = await apiCall<{ csv: string }>(
      "exportDashboardCSV",
      { filters },
      token
    );
    downloadCSV(result.csv, "dashboard-bingo.csv");
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard — BINGO</h1>
        <div className="flex gap-2">
          <RefreshButton onRefresh={() => mutate()} loading={isLoading} />
          <button
            type="button"
            onClick={exportCSV}
            className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <FilterSelect
          label="Vendedor"
          value={filters.vendedor}
          onChange={(v) => setFilters({ ...filters, vendedor: v })}
          options={[
            { value: "", label: "Todos" },
            ...(data?.vendedores || []).map((v) => ({ value: v, label: v })),
          ]}
        />
        <FilterInput
          label="Cant. mín"
          value={filters.cantidadMin}
          onChange={(v) => setFilters({ ...filters, cantidadMin: v })}
        />
        <FilterInput
          label="Cant. máx"
          value={filters.cantidadMax}
          onChange={(v) => setFilters({ ...filters, cantidadMax: v })}
        />
        <FilterInput
          label="Monto mín"
          value={filters.montoMin}
          onChange={(v) => setFilters({ ...filters, montoMin: v })}
        />
        <FilterInput
          label="Monto máx"
          value={filters.montoMax}
          onChange={(v) => setFilters({ ...filters, montoMax: v })}
        />
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={filters.includeNonApproved}
            onChange={(e) =>
              setFilters({
                ...filters,
                includeNonApproved: e.target.checked,
              })
            }
          />
          Incluir no completadas
        </label>
      </div>

      <SectionLoader loading={isLoading}>
        {error && (
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Error"}
          </p>
        )}
        {data && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <KpiCard
                label="Ventas aprobadas"
                value={String(data.kpis.ventasAprobadas)}
              />
              <KpiCard
                label="Cartones vendidos"
                value={String(data.kpis.cartonesVendidos)}
              />
              <KpiCard
                label="Monto recaudado"
                value={formatColones(data.kpis.montoRecaudado)}
              />
            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Cartones por vendedor"
                data={data.charts.cantidadPorVendedor}
              />
              <ChartCard
                title="Monto por vendedor"
                data={data.charts.montoPorVendedor}
              />
            </div>

            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="p-3">Comprador</th>
                    <th className="p-3">Modalidad</th>
                    <th className="p-3">Cantidad</th>
                    <th className="p-3">Precio Pagado</th>
                    <th className="p-3">Vendedor</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tabla.map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-3">{row.comprador}</td>
                      <td className="p-3">{row.modalidad}</td>
                      <td className="p-3">{row.cantidad}</td>
                      <td className="p-3">
                        {formatColones(row.precioPagado)}
                      </td>
                      <td className="p-3">{row.vendedor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SectionLoader>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-amber-700">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number }[];
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-4 font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border px-2 py-1.5 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border px-2 py-1.5 text-sm"
      />
    </div>
  );
}
