import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { formatColones } from "@/lib/api";

export interface ExitoData {
  entradaID: number;
  codigoCompra?: string;
  nombre: string;
  apellido: string;
  cantidad: number;
  monto: number;
}

export interface LogoMeta {
  dataUrl: string;
  width: number;
  height: number;
}

const PX_TO_MM = 0.264583;

function purchaseId(data: ExitoData) {
  return data.codigoCompra || String(data.entradaID);
}

function confirmationText(data: ExitoData) {
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
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function renderIdBoxCanvas(data: ExitoData): Promise<HTMLCanvasElement> {
  const id = escapeHtml(purchaseId(data));
  const monto = escapeHtml(formatColones(data.monto));
  const cartones =
    data.cantidad === 1 ? "1 cartón" : `${data.cantidad} cartones`;

  const container = document.createElement("div");
  container.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    "width:400px",
    "box-sizing:border-box",
    "background:#fffbeb",
    "border:2px solid #fbbf24",
    "border-radius:12px",
    "padding:20px",
    "text-align:center",
    "font-family:Arial,Helvetica,sans-serif",
  ].join(";");

  container.innerHTML = `
    <p style="margin:0;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#78350f">
      ID de tu Compra
    </p>
    <p style="margin:8px 0 0;font-family:Consolas,Monaco,monospace;font-size:28px;font-weight:700;letter-spacing:0.15em;color:#92400e">
      ${id}
    </p>
    <p style="margin:12px 0 0;font-size:13px;color:#92400e">
      Nº de registro: ${data.entradaID}
    </p>
    <p style="margin:4px 0 0;font-size:13px;color:#92400e">
      Monto: ${monto}
    </p>
    <p style="margin:4px 0 0;font-size:13px;color:#92400e">
      ${cartones}
    </p>
  `;

  document.body.appendChild(container);

  try {
    return await html2canvas(container, {
      scale: 2,
      backgroundColor: "#fffbeb",
      logging: false,
      useCORS: false,
      allowTaint: true,
      width: 400,
      windowWidth: 400,
    });
  } finally {
    document.body.removeChild(container);
  }
}

function ensureSpace(pdf: jsPDF, y: number, needed: number, margin: number) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (y + needed > pageHeight - margin) {
    pdf.addPage();
    return margin;
  }
  return y;
}

function writeParagraph(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  margin: number,
  lineHeight: number,
  fontSize: number,
  style: "normal" | "italic" = "normal"
) {
  pdf.setFont("helvetica", style);
  pdf.setFontSize(fontSize);
  pdf.setTextColor(55, 55, 55);

  const lines = pdf.splitTextToSize(text, maxWidth) as string[];
  for (const line of lines) {
    y = ensureSpace(pdf, y, lineHeight, margin);
    pdf.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

export async function buildComprobantePdf(
  data: ExitoData,
  logo: LogoMeta | null
): Promise<jsPDF> {
  const pdf = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const copy = confirmationText(data);
  let y = margin;

  if (logo) {
    const logoWidthMm = logo.width * PX_TO_MM;
    const logoHeightMm = logo.height * PX_TO_MM;
    const logoX = (pageWidth - logoWidthMm) / 2;
    pdf.addImage(logo.dataUrl, "PNG", logoX, y, logoWidthMm, logoHeightMm);
    y += logoHeightMm + 8;
  }

  y = writeParagraph(pdf, copy.intro, margin, y, contentWidth, margin, 6, 11);
  y += 2;
  y = writeParagraph(
    pdf,
    "Tu compra ha sido registrada con éxito.",
    margin,
    y,
    contentWidth,
    margin,
    6,
    11
  );
  y += 4;

  const idBoxCanvas = await renderIdBoxCanvas(data);
  const idBoxWidthMm = contentWidth;
  const idBoxHeightMm = (idBoxCanvas.height / idBoxCanvas.width) * idBoxWidthMm;
  y = ensureSpace(pdf, y, idBoxHeightMm + 4, margin);
  pdf.addImage(
    idBoxCanvas.toDataURL("image/png"),
    "PNG",
    margin,
    y,
    idBoxWidthMm,
    idBoxHeightMm
  );
  y += idBoxHeightMm + 8;

  y = writeParagraph(pdf, copy.body, margin, y, contentWidth, margin, 5.5, 10);
  y += 4;
  writeParagraph(pdf, copy.closing, margin, y, contentWidth, margin, 5.5, 10, "italic");

  return pdf;
}

export async function downloadComprobantePdf(
  data: ExitoData,
  logo: LogoMeta | null
) {
  const pdf = await buildComprobantePdf(data, logo);
  pdf.save(`comprobante-bingo-${purchaseId(data)}.pdf`);
}
