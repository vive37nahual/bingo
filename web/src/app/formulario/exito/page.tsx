"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatColones } from "@/lib/api";

interface ExitoData {
  entradaID: number;
  codigoCompra?: string;
  nombre: string;
  apellido: string;
  cantidad: number;
  monto: number;
}

function purchaseId(data: ExitoData) {
  return data.codigoCompra || String(data.entradaID);
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

function buildFallbackPdf(data: ExitoData) {
  const pdf = new jsPDF({ unit: "mm", format: "letter" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;
  const copy = CONFIRMATION_TEXT(data);
  const id = purchaseId(data);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("VIVE 37 Nahual — BINGO", pageWidth / 2, y, { align: "center" });
  y += 12;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text(copy.intro, margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 14;

  pdf.setFont("helvetica", "bold");
  pdf.text("ID de tu Compra:", margin, y);
  y += 8;
  pdf.setFontSize(18);
  pdf.text(id, margin, y);
  y += 10;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(`Nº de registro (entradaID): ${data.entradaID}`, margin, y);
  y += 8;
  pdf.text(`Cantidad: ${data.cantidad} cartón(es)`, margin, y);
  y += 6;
  pdf.text(`Monto registrado: ${formatColones(data.monto)}`, margin, y);
  y += 10;

  pdf.setFontSize(11);
  pdf.text(copy.body, margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 40;
  pdf.setFont("helvetica", "italic");
  pdf.text(copy.closing, margin, y, { maxWidth: pageWidth - margin * 2 });

  pdf.save(`comprobante-bingo-${id}.pdf`);
}

export default function FormularioExitoPage() {
  const router = useRouter();
  const [data, setData] = useState<ExitoData | null>(null);
  const [savingPdf, setSavingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("formulario_exito");
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  const savePDF = async () => {
    if (!data || !contentRef.current) return;
    setSavingPdf(true);
    setPdfError("");
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "letter" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(`comprobante-bingo-${purchaseId(data)}.pdf`);
    } catch {
      try {
        buildFallbackPdf(data);
      } catch {
        setPdfError(
          "No se pudo generar el PDF. Intente de nuevo o tome una captura de pantalla."
        );
      }
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
  const id = purchaseId(data);

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

        <div
          ref={contentRef}
          className="rounded-2xl bg-white p-8 shadow-lg"
        >
          <p className="text-gray-800 leading-relaxed">{copy.intro}</p>
          <p className="mt-4 text-gray-800 leading-relaxed">
            Tu compra ha sido registrada con éxito.
          </p>

          <div className="mt-6 rounded-xl border-2 border-amber-400 bg-amber-50 p-5 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-900">
              ID de tu Compra
            </p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-widest text-amber-800">
              {id}
            </p>
            <p className="mt-2 text-xs text-amber-700">
              Nº de registro: {data.entradaID}
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

        {pdfError && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {pdfError}
          </p>
        )}

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
