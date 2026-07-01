"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { apiCall, fileToBase64, formatColones } from "@/lib/api";
import type { FormConfig } from "@/lib/types";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { Upload } from "lucide-react";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
  "application/pdf",
];

export default function FormularioPage() {
  const router = useRouter();
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    modalidad: "",
    correo: "",
    notifyWhatsApp: false,
    numWA: "",
    cantidad: 1,
    vendedor: "",
    metodo: "",
  });
  const [cantidadInput, setCantidadInput] = useState("1");

  useEffect(() => {
    apiCall<FormConfig>("getFormConfig")
      .then(setConfig)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const cantidadForPrice =
    Number(cantidadInput) >= 1 && Number(cantidadInput) <= 20
      ? Number(cantidadInput)
      : form.cantidad;

  const monto =
    config?.precios[String(cantidadForPrice)] ??
    config?.precios[cantidadForPrice] ??
    0;

  const clampCantidad = (value: number) => Math.min(20, Math.max(1, value));

  const setCantidad = (value: number) => {
    const clamped = clampCantidad(value);
    setForm((prev) => ({ ...prev, cantidad: clamped }));
    setCantidadInput(String(clamped));
  };

  const handleCantidadBlur = () => {
    const parsed = Number(cantidadInput);
    if (!cantidadInput.trim() || Number.isNaN(parsed)) {
      setCantidad(form.cantidad);
      return;
    }
    setCantidad(parsed);
  };

  const validateEmail = useCallback((email: string) => {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setEmailValid(email ? valid : null);
    return valid;
  }, []);

  const handleFile = (f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(heic|heif)$/i)) {
      setError("Tipo de archivo no permitido");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Archivo demasiado grande (máx 10MB)");
      return;
    }
    setFile(f);
    setError("");
  };

  const formatWA = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.modalidad) {
      setError("Seleccione Virtual o Presencial");
      return;
    }
    if (!validateEmail(form.correo)) {
      setError("Correo electrónico inválido");
      return;
    }
    if (form.notifyWhatsApp && !/^\d{4}-\d{4}$/.test(form.numWA)) {
      setError("Número WhatsApp inválido (XXXX-XXXX)");
      return;
    }
    if (!file) {
      setError("Debe subir un comprobante de pago");
      return;
    }

    const cantidadFinal = Number(cantidadInput);
    if (
      !cantidadInput.trim() ||
      Number.isNaN(cantidadFinal) ||
      cantidadFinal < 1 ||
      cantidadFinal > 20
    ) {
      setError("Cantidad de cartones debe ser entre 1 y 20");
      return;
    }
    setCantidad(cantidadFinal);

    setSubmitting(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await apiCall<{
        entradaID: number;
        nombre: string;
        apellido: string;
        cantidad: number;
        monto: number;
      }>("submitEntrada", {
        ...form,
        cantidad: cantidadFinal,
        comprobanteBase64: base64,
        comprobanteMimeType: file.type || "application/octet-stream",
        comprobanteFileName: file.name,
      });

      sessionStorage.setItem(
        "formulario_exito",
        JSON.stringify(result)
      );
      router.push("/formulario/exito");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <Image
            src="/logo-ref.png"
            alt="VIVE 37 Nahual"
            width={160}
            height={160}
            className="mx-auto h-24 w-auto object-contain"
          />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Compra de Cartones BINGO
          </h1>
        </div>

        <SectionLoader loading={loading || submitting}>
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl bg-white p-6 shadow-lg"
          >
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" required>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="input-field"
                />
              </Field>
              <Field label="Apellidos" required>
                <input
                  required
                  value={form.apellido}
                  onChange={(e) =>
                    setForm({ ...form, apellido: e.target.value })
                  }
                  className="input-field"
                />
              </Field>
            </div>

            <Field label="¿Virtual o Presencial?" required>
              <select
                required
                value={form.modalidad}
                onChange={(e) =>
                  setForm({ ...form, modalidad: e.target.value })
                }
                className="input-field"
              >
                <option value="">Seleccione...</option>
                <option value="Virtual">Virtual</option>
                <option value="Presencial">Presencial</option>
              </select>
            </Field>

            <Field label="Correo Electrónico" required>
              <input
                required
                type="email"
                value={form.correo}
                onChange={(e) => {
                  setForm({ ...form, correo: e.target.value });
                  validateEmail(e.target.value);
                }}
                className={`input-field ${
                  emailValid === false
                    ? "border-red-500"
                    : emailValid === true
                      ? "border-green-500"
                      : ""
                }`}
              />
              {emailValid === false && (
                <p className="mt-1 text-xs text-red-600">Correo inválido</p>
              )}
            </Field>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.notifyWhatsApp}
                onChange={(e) =>
                  setForm({ ...form, notifyWhatsApp: e.target.checked })
                }
                className="h-4 w-4"
              />
              <span className="text-sm">¿Desea ser notificado por WhatsApp?</span>
            </label>

            {form.notifyWhatsApp && (
              <Field label="Número de WhatsApp" required>
                <input
                  required
                  placeholder="XXXX-XXXX"
                  value={form.numWA}
                  onChange={(e) =>
                    setForm({ ...form, numWA: formatWA(e.target.value) })
                  }
                  className="input-field"
                />
              </Field>
            )}

            <div className="flex flex-wrap items-end gap-4">
              <Field label="Cantidad de cartones" required>
                <div className="flex items-stretch">
                  <button
                    type="button"
                    aria-label="Disminuir cantidad"
                    onClick={() => setCantidad(form.cantidad - 1)}
                    disabled={form.cantidad <= 1}
                    className="rounded-l-lg border border-r-0 border-gray-300 bg-amber-50 px-3 text-lg font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-40"
                  >
                    −
                  </button>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={cantidadInput}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setCantidadInput(digits);
                      if (digits !== "") {
                        const parsed = Number(digits);
                        if (parsed >= 1 && parsed <= 20) {
                          setForm((prev) => ({ ...prev, cantidad: parsed }));
                        }
                      }
                    }}
                    onBlur={handleCantidadBlur}
                    className="input-field w-16 rounded-none border-x-0 text-center [appearance:textfield]"
                  />
                  <button
                    type="button"
                    aria-label="Aumentar cantidad"
                    onClick={() => setCantidad(form.cantidad + 1)}
                    disabled={form.cantidad >= 20}
                    className="rounded-r-lg border border-l-0 border-gray-300 bg-amber-50 px-3 text-lg font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Entre 1 y 20 cartones</p>
              </Field>
              <div className="rounded-lg bg-amber-50 px-4 py-2">
                <span className="text-sm text-gray-600">Monto total: </span>
                <span className="text-lg font-bold text-amber-800">
                  {formatColones(monto)}
                </span>
              </div>
            </div>

            <Field label="Vendedor" required>
              <select
                required
                value={form.vendedor}
                onChange={(e) =>
                  setForm({ ...form, vendedor: e.target.value })
                }
                className="input-field"
              >
                <option value="">Seleccione...</option>
                {config?.equipo.map((m) => (
                  <option key={m.id} value={m.nombre}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Método de pago" required>
              <div className="space-y-2">
                {[
                  { value: "SINPE", label: "SINPE Móvil" },
                  { value: "Transferencia", label: "Transferencia Bancaria" },
                  { value: "Efectivo", label: "Efectivo" },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="metodo"
                      required
                      value={opt.value}
                      checked={form.metodo === opt.value}
                      onChange={(e) =>
                        setForm({ ...form, metodo: e.target.value })
                      }
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {form.metodo === "SINPE" && (
                <p className="mt-2 text-sm text-gray-600">
                  Número SINPE Móvil: {config?.sinpe.numero} a nombre de{" "}
                  {config?.sinpe.nombre}
                </p>
              )}
              {form.metodo === "Transferencia" && (
                <p className="mt-2 text-sm text-gray-600">
                  Cuenta IBAN: {config?.iban}
                </p>
              )}
              {form.metodo === "Efectivo" && (
                <p className="mt-2 text-sm text-gray-600">
                  Para pagos en efectivo, presente su comprobante mediante una
                  fotografía donde aparezca usted junto al representante
                  autorizado de VIVE 37 Nahual sosteniendo el monto
                  correspondiente. Esta imagen servirá como constancia oficial de
                  la transacción.
                </p>
              )}
            </Field>

            <Field label="Comprobante de Pago" required>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition ${
                  dragOver
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-300 hover:border-amber-400"
                }`}
                onClick={() =>
                  document.getElementById("file-input")?.click()
                }
              >
                <Upload className="mb-2 h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Arrastre su archivo aquí o explore en su dispositivo
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  JPG, PNG, HEIC, WebP, PDF — máx 10MB
                </p>
                {file && (
                  <p className="mt-2 text-sm font-medium text-amber-700">
                    {file.name}
                  </p>
                )}
                <input
                  id="file-input"
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </div>
            </Field>

            <button
              type="submit"
              disabled={submitting || emailValid === false}
              className="w-full rounded-xl bg-amber-600 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Enviar Formulario"}
            </button>
          </form>
        </SectionLoader>
      </div>

      <style jsx global>{`
        .input-field {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          padding: 0.5rem 0.75rem;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
