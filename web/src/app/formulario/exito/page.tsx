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

interface LogoMeta {
  dataUrl: string;
  width: number;
  height: number;
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

async function loadLogoMeta(path: string): Promise<LogoMeta> {
  const response = await fetch(path);
  if (!response.ok) throw new Error("No se pudo cargar el logo");
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });

  const displayHeight = 160;
  const displayWidth = Math.round(
    (img.naturalWidth / img.naturalHeight) * displayHeight
  );

  return { dataUrl, width: displayWidth, height: displayHeight };
}

function addCanvasToPdf(canvas: HTMLCanvasElement, pdf: jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  const ratio = canvas.width / canvas.height;
  let drawWidth = maxWidth;
  let drawHeight = drawWidth / ratio;

  if (drawHeight > maxHeight) {
    drawHeight = maxHeight;
    drawWidth = drawHeight * ratio;
  }

  const x = (pageWidth - drawWidth) / 2;
  const y = (pageHeight - drawHeight) / 2;
  const imgData = canvas.toDataURL("image/png");

  pdf.addImage(imgData, "PNG", x, y, drawWidth, drawHeight);
}

async function captureElement(el: HTMLElement) {
  await document.fonts.ready;

  const images = el.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    )
  );

  return html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    logging: false,
    useCORS: true,
    allowTaint: false,
    imageTimeout: 15000,
    onclone: (clonedDoc) => {
      const cloned = clonedDoc.querySelector("[data-comprobante]");
      if (cloned instanceof HTMLElement) {
        cloned.style.boxShadow = "none";
        cloned.style.width = "480px";
        cloned.style.maxWidth = "480px";
      }
    },
  });
}

function ComprobanteDocument({
  data,
  logo,
  innerRef,
}: {
  data: ExitoData;
  logo: LogoMeta | null;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const copy = CONFIRMATION_TEXT(data);
  const id = purchaseId(data);

  return (
    <div
      ref={innerRef}
      data-comprobante
      className="mx-auto w-full max-w-[480px] rounded-2xl bg-white p-8 shadow-lg"
      style={{ backgroundColor: "#ffffff" }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo.dataUrl}
          alt="VIVE 37 Nahual"
          width={logo.width}
          height={logo.height}
          className="mx-auto mb-6 block"
          style={{
            width: logo.width,
            height: logo.height,
            objectFit: "contain",
          }}
        />
      ) : (
        <div className="mx-auto mb-6 h-40 w-40 animate-pulse rounded-lg bg-amber-100" />
      )}

      <p className="text-base text-gray-800 leading-relaxed">{copy.intro}</p>
      <p className="mt-4 text-base text-gray-800 leading-relaxed">
        Tu compra ha sido registrada con éxito.
      </p>

      <div
        data-id-box
        className="mt-6 rounded-xl border-2 border-amber-400 p-5 text-center"
        style={{ backgroundColor: "#fffbeb", borderColor: "#fbbf24" }}
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-900">
          ID de tu Compra
        </p>
        <p className="mt-2 font-mono text-3xl font-bold tracking-widest text-amber-800">
          {id}
        </p>
        <p className="mt-3 text-sm text-amber-800">
          Nº de registro: {data.entradaID}
        </p>
        <p className="mt-1 text-sm text-amber-800">
          Monto: {formatColones(data.monto)}
        </p>
        <p className="mt-1 text-sm text-amber-800">
          {data.cantidad === 1 ? "1 cartón" : `${data.cantidad} cartones`}
        </p>
      </div>

      <p className="mt-6 whitespace-pre-line text-sm text-gray-700 leading-relaxed">
        {copy.body}
      </p>
      <p className="mt-6 whitespace-pre-line text-sm italic text-gray-700">
        {copy.closing}
      </p>
    </div>
  );
}

export default function FormularioExitoPage() {
  const router = useRouter();
  const [data, setData] = useState<ExitoData | null>(null);
  const [logo, setLogo] = useState<LogoMeta | null>(null);
  const [savingPdf, setSavingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("formulario_exito");
    if (stored) {
      setData(JSON.parse(stored));
    }
    loadLogoMeta("/logo-ref.png")
      .then(setLogo)
      .catch(() => setLogo(null));
  }, []);

  const savePDF = async () => {
    if (!data || !contentRef.current) return;
    if (!logo) {
      setPdfError("Espere un momento a que cargue el logo e intente de nuevo.");
      return;
    }

    setSavingPdf(true);
    setPdfError("");

    try {
      const canvas = await captureElement(contentRef.current);
      const pdf = new jsPDF({
        unit: "mm",
        format: "letter",
        orientation: "portrait",
      });
      addCanvasToPdf(canvas, pdf);
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
        <ComprobanteDocument data={data} logo={logo} innerRef={contentRef} />

        {pdfError && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {pdfError}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={savePDF}
            disabled={savingPdf || !logo}
            className="flex-1 rounded-xl border-2 border-amber-600 py-3 font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            {savingPdf
              ? "Generando PDF..."
              : !logo
                ? "Preparando PDF..."
                : "Guardar PDF"}
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
