import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const gasUrl = process.env.GAS_WEB_APP_URL;

  if (!gasUrl) {
    return NextResponse.json(
      {
        success: false,
        status: 500,
        data: { error: "GAS_WEB_APP_URL no configurada" },
      },
      { status: 500 }
    );
  }

  try {
    const rawBody = await request.text();
    let bodyObj: {
      action?: string;
      token?: string | null;
      payload?: Record<string, unknown>;
    };
    try {
      bodyObj = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          data: { error: "JSON inválido" },
        },
        { status: 400 }
      );
    }

    if (bodyObj.action === "submitEntrada" && bodyObj.payload) {
      const forwarded = request.headers.get("x-forwarded-for");
      const clientIp =
        forwarded?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
      bodyObj.payload.clientIp = clientIp;
    }

    const body = JSON.stringify(bodyObj);
    const response = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      redirect: "follow",
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          status: 502,
          data: { error: "Respuesta inválida del backend", raw: text.slice(0, 200) },
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: response.ok ? 200 : 400 });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        status: 502,
        data: {
          error: err instanceof Error ? err.message : "Error de conexión con GAS",
        },
      },
      { status: 502 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
