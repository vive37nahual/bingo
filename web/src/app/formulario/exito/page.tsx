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

async function loadImageDataUrl(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) throw new Error("No se pudo cargar el logo");
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function buildPdfWithJsPdf(data: ExitoData, logoDataUrl: string | null) {
  const pdf = new jsPDF({ unit: "mm", format: "letter" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let y = 18;
  const copy = CONFIRMATION_TEXT(data);
  const id = purchaseId(data);

  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, "PNG", pageWidth / 2 - 28, y, 56, 56);
    y += 62;
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(30, 30, 30);

  const introLines = pdf.splitTextToSize(copy.intro, pageWidth - margin * 2);
  pdf.text(introLines, margin, y);
  y += introLines.length * 6 + 4;

  pdf.text("Tu compra ha sido registrada con éxito.", margin, y);
  y += 10;

  pdf.setDrawColor(251, 191, 36);
  pdf.setFillColor(255, 251, 235);
  pdf.roundedRect(margin, y, pageWidth - margin * 2, 32, 3, 3, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(120, 53, 15);
  pdf.text("ID DE TU COMPRA", pageWidth / 2, y + 8, { align: "center" });

  pdf.setFont("courier", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(146, 64, 14);
  pdf.text(id, pageWidth / 2, y + 18, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(
    `Registro: ${data.entradaID}  ·  ${formatColones(data.monto)}  ·  ${data.cantidad} cartón(es)`,
    pageWidth / 2,
    y + 26,
    { align: "center" }
  );
  y += 40;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(55, 55, 55);
  const bodyLines = pdf.splitTextToSize(copy.body, pageWidth - margin * 2);
  pdf.text(bodyLines, margin, y);
  y += bodyLines.length * 5 + 8;

  pdf.setFont("helvetica", "italic");
  const closingLines = pdf.splitTextToSize(copy.closing, pageWidth - margin * 2);
  pdf.text(closingLines, margin, y);

  pdf.save(`comprobante-bingo-${id}.pdf`);
}

function ComprobanteDocument({
  data,
  logoSrc,
  innerRef,
}: {
  data: ExitoData;
  logoSrc: string;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const copy = CONFIRMATION_TEXT(data);
  const id = purchaseId(data);

  return (
    <div
      ref={innerRef}
      className="rounded-2xl bg-white p-8 shadow-lg"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        alt="VIVE 37 Nahual"
        className="mx-auto mb-6 h-36 w-auto max-w-full object-contain"
      />

      <p className="text-gray-800 leading-relaxed">{copy.intro}</p>
      <p className="mt-4 text-gray-800 leading-relaxed">
        Tu compra ha sido registrada con éxito.
      </p>

      <div
        className="mt-6 rounded-xl border-2 border-amber-400 p-5 text-center"
        style={{ backgroundColor: "#fffbeb", borderColor: "#fbbf24" }}
      >
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
  );
}

export default function FormularioExitoPage() {
  const router = useRouter();
  const [data, setData] = useState<ExitoData | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [savingPdf, setSavingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("formulario_exito");
    if (stored) {
      setData(JSON.parse(stored));
    }
    loadImageDataUrl("/logo-ref.png")
      .then(setLogoDataUrl)
      .catch(() => setLogoDataUrl(null));
  }, []);

  const savePDF = async () => {
    if (!data || !contentRef.current) return;
    setSavingPdf(true);
    setPdfError("");

    try {
      const images = contentRef.current.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) resolve();
              else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            })
        )
      );

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: false,
        allowTaint: true,
        logging: false,
        imageTimeout: 0,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({ unit: "mm", format: "letter" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, "JPEG", margin, margin, contentWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = margin;
        pdf.addImage(imgData, "JPEG", margin, position, contentWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
        while (heightLeft > 0) {
          pdf.addPage();
          position = margin - (imgHeight - heightLeft);
          pdf.addImage(imgData, "JPEG", margin, position, contentWidth, imgHeight);
          heightLeft -= pageHeight - margin * 2;
        }
      }

      pdf.save(`comprobante-bingo-${purchaseId(data)}.pdf`);
    } catch {
      try {
        buildPdfWithJsPdf(data, logoDataUrl);
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

  const logoSrc = logoDataUrl || "/logo-ref.png";

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white px-4 py-12">
      <div className="mx-auto max-w-lg">
        <ComprobanteDocument
          data={data}
          logoSrc={logoSrc}
          innerRef={contentRef}
        />

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
