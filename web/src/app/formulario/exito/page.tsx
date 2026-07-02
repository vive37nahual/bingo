"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

function ComprobanteDocument({
  data,
  innerRef,
}: {
  data: ExitoData;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const copy = CONFIRMATION_TEXT(data);
  const id = purchaseId(data);

  return (
    <div
      ref={innerRef}
      className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white shadow-xl"
    >
      <div className="bg-[#441900] px-6 py-10 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-ref.png"
          alt="Equipo Nahual — VIVE 37"
          className="mx-auto h-44 w-auto max-w-full object-contain"
          crossOrigin="anonymous"
        />
        <h2 className="mt-5 text-xl font-bold tracking-wide text-amber-50">
          VIVE 37 Nahual — BINGO
        </h2>
        <p className="mt-1 text-sm text-amber-200/90">
          Comprobante de registro de compra
        </p>
      </div>

      <div className="border-t border-amber-100 bg-white px-8 py-8">
        <p className="text-base leading-relaxed text-gray-800">{copy.intro}</p>
        <p className="mt-4 text-base leading-relaxed text-gray-800">
          Tu compra ha sido registrada con éxito.
        </p>

        <div className="mt-6 rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-900">
            ID de tu Compra
          </p>
          <p className="mt-3 font-mono text-4xl font-bold tracking-widest text-amber-800">
            {id}
          </p>
          <div className="mt-4 space-y-1 text-sm text-amber-800">
            <p>
              <span className="font-semibold">Nº de registro:</span>{" "}
              {data.entradaID}
            </p>
            <p>
              <span className="font-semibold">Monto:</span>{" "}
              {formatColones(data.monto)}
            </p>
            <p>
              <span className="font-semibold">Cartones:</span> {data.cantidad}
            </p>
          </div>
        </div>

        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-gray-700">
          {copy.body}
        </p>
        <p className="mt-6 whitespace-pre-line text-sm italic leading-relaxed text-gray-700">
          {copy.closing}
        </p>
      </div>

      <div className="border-t border-amber-900/20 bg-[#92400e] px-6 py-4 text-center text-xs text-amber-50">
        BINGO VIVE 37 Nahual — En beneficio de Casa Hogar San Lazaro
      </div>
    </div>
  );
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
        scale: 3,
        backgroundColor: "#fffbeb",
        useCORS: true,
        logging: false,
        imageTimeout: 15000,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, "PNG", margin, margin, contentWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = margin;
        pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;

        while (heightLeft > 0) {
          pdf.addPage();
          position = margin - (imgHeight - heightLeft);
          pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
          heightLeft -= pageHeight - margin * 2;
        }
      }

      pdf.save(`comprobante-bingo-${purchaseId(data)}.pdf`);
    } catch {
      setPdfError(
        "No se pudo generar el PDF. Intente de nuevo o tome una captura de pantalla."
      );
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white px-4 py-12">
      <div className="mx-auto max-w-lg">
        <ComprobanteDocument data={data} innerRef={contentRef} />

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
