"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ExitoData {
  entradaID: number;
  nombre: string;
  apellido: string;
  cantidad: number;
  monto: number;
}

export default function FormularioExitoPage() {
  const router = useRouter();
  const [data, setData] = useState<ExitoData | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("formulario_exito");
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  const savePDF = async () => {
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current);
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, width, height);
    pdf.save(`compra-bingo-${data?.entradaID}.pdf`);
  };

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">No hay datos de compra.</p>
      </div>
    );
  }

  const cartonesLabel =
    data.cantidad === 1 ? "1 cartón" : `${data.cantidad} cartones`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white px-4 py-12">
      <div className="mx-auto max-w-lg">
        <Image
          src="/logo.png"
          alt="VIVE 37 Nahual"
          width={120}
          height={120}
          className="mx-auto mb-6 h-20 w-auto object-contain"
        />

        <div
          ref={contentRef}
          className="rounded-2xl bg-white p-8 shadow-lg"
        >
          <p className="whitespace-pre-line text-gray-800 leading-relaxed">
            {`Gracias ${data.nombre} ${data.apellido} por comprar ${cartonesLabel} para este BINGO.

Tu compra ha sido registrada con éxito.

ID de tu Compra:
${data.entradaID}

Guarda este ID en caso de que requieras apoyarte en cualquier tema de trámite.

Puedes contactar a cualquier miembro del equipo VIVE 37 Nahual en caso de que tengas una consulta al respecto.

Las solicitudes enviadas son revisadas de forma manual y posteriormente te enviaremos la información de confirmación por el medio de contacto seleccionado.

Agradecemos de antemano tu apoyo y paciencia.

Atentamente:
VIVE 37 Nahual.`}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={savePDF}
            className="flex-1 rounded-xl border-2 border-amber-600 py-3 font-semibold text-amber-700 hover:bg-amber-50"
          >
            Guardar PDF
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
