"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import jsPDF from "jspdf";
import { formatColones } from "@/lib/api";
import { CheckCircle2 } from "lucide-react";

interface ExitoData {
  entradaID: number;
  codigoCompra: string;
  nombre: string;
  apellido: string;
  cantidad: number;
  monto: number;
}

const CONFIRMATION_TEXT = (data: ExitoData) => {
  const cartonesLabel =
    data.cantidad === 1 ? "1 cartón" : `${data.cantidad} cartones`;

  return {
    intro: `Gracias ${data.nombre} ${data.apellido} por comprar ${cartonesLabel} para este BINGO.`,
    body: [
      "Tu compra ha sido registrada con éxito.",
      "",
      "Guarda este ID en caso de que requieras apoyarte en cualquier tema de trámite.",
      "",
      "Puedes contactar a cualquier miembro del equipo VIVE 37 Nahual en caso de que tengas una consulta al respecto.",
      "",
      "Las solicitudes enviadas son revisadas de forma manual y posteriormente te enviaremos la información de confirmación por el medio de contacto seleccionado.",
      "",
      "Agradecemos de antemano tu apoyo y paciencia.",
    ].join("\n"),
    closing: "Atentamente:\nVIVE 37 Nahual",
  };
};

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/logo-ref.png");
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function FormularioExitoPage() {
  const router = useRouter();
  const [data, setData] = useState<ExitoData | null>(null);
  const [savingPdf, setSavingPdf] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("formulario_exito");
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  const savePDF = async () => {
    if (!data) return;
    setSavingPdf(true);
    try {
      const pdf = new jsPDF({ unit: "mm", format: "letter" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let y = 18;

      const logo = await loadLogoDataUrl();
      if (logo) {
        pdf.addImage(logo, "PNG", pageWidth / 2 - 25, y, 50, 50);
        y += 58;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(120, 53, 15);
      pdf.text("VIVE 37 Nahual — BINGO", pageWidth / 2, y, { align: "center" });
      y += 8;

      pdf.setFontSize(11);
      pdf.setTextColor(80, 80, 80);
      pdf.text("Comprobante de registro de compra", pageWidth / 2, y, {
        align: "center",
      });
      y += 14;

      pdf.setDrawColor(245, 158, 11);
      pdf.setLineWidth(0.8);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      const copy = CONFIRMATION_TEXT(data);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(30, 30, 30);

      const introLines = pdf.splitTextToSize(copy.intro, pageWidth - margin * 2);
      pdf.text(introLines, margin, y);
      y += introLines.length * 6 + 4;

      pdf.setFont("helvetica", "bold");
      pdf.text("ID de tu Compra:", margin, y);
      y += 7;

      pdf.setFillColor(255, 251, 235);
      pdf.roundedRect(margin, y - 5, pageWidth - margin * 2, 14, 2, 2, "F");
      pdf.setFont("courier", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(146, 64, 14);
      pdf.text(data.codigoCompra, pageWidth / 2, y + 4, { align: "center" });
      y += 18;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`Cantidad: ${data.cantidad} cartón(es)`, margin, y);
      y += 6;
      pdf.text(`Monto registrado: ${formatColones(data.monto)}`, margin, y);
      y += 10;

      const bodyLines = pdf.splitTextToSize(copy.body, pageWidth - margin * 2);
      pdf.text(bodyLines, margin, y);
      y += bodyLines.length * 5 + 8;

      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(10);
      const closingLines = pdf.splitTextToSize(copy.closing, pageWidth - margin * 2);
      pdf.text(closingLines, margin, y);

      y = pdf.internal.pageSize.getHeight() - 15;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(130, 130, 130);
      pdf.text(
        `Documento generado el ${new Date().toLocaleString("es-CR")}`,
        pageWidth / 2,
        y,
        { align: "center" }
      );

      pdf.save(`comprobante-bingo-${data.codigoCompra}.pdf`);
    } finally {
      setSavingPdf(false);
    }
  };

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-gray-600">Cargando confirmación...</p>
        </div>
      </div>
    );
  }

  const copy = CONFIRMATION_TEXT(data);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white px-4 py-12">
      <div className="mx-auto max-w-lg">
        <Image
          src="/logo-ref.png"
          alt="VIVE 37 Nahual"
          width={120}
          height={120}
          className="mx-auto mb-6 h-20 w-auto object-contain"
        />

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <p className="text-gray-800 leading-relaxed">{copy.intro}</p>
          <p className="mt-4 text-gray-800 leading-relaxed">
            Tu compra ha sido registrada con éxito.
          </p>

          <div className="mt-6 rounded-xl border-2 border-amber-400 bg-amber-50 p-5 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-900">
              ID de tu Compra
            </p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-widest text-amber-800">
              {data.codigoCompra}
            </p>
            <p className="mt-2 text-sm text-amber-700">
              Monto: {formatColones(data.monto)} · {data.cantidad} cartón(es)
            </p>
          </div>

          <p className="mt-6 whitespace-pre-line text-gray-700 leading-relaxed">
            {copy.body}
          </p>
          <p className="mt-6 whitespace-pre-line text-gray-700 italic">
            {copy.closing}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={savePDF}
            disabled={savingPdf}
            className="flex-1 rounded-xl border-2 border-amber-600 py-3 font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            {savingPdf ? "Generando PDF..." : "Guardar PDF"}
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem("formulario_exito");
              router.push("/formulario");
            }}
            className="flex-1 rounded-xl bg-amber-600 py-3 font-semibold text-white hover:bg-amber-700"
          >
            Regresar al Formulario
          </button>
        </div>
      </div>
    </div>
  );
}
