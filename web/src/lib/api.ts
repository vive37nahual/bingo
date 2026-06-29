interface ApiResponse<T = unknown> {
  success: boolean;
  status: number;
  data: T & { error?: string };
}

export async function apiCall<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
  token?: string | null
): Promise<T> {
  const res = await fetch("/api/gas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, token: token || null, payload }),
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success || json.data?.error) {
    throw new Error(json.data?.error || "Error en la solicitud");
  }

  return json.data as T;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatColones(amount: number): string {
  return `₡${amount.toLocaleString("es-CR")}`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const MYFREE_BINGO_URL =
  "https://myfreebingocards.com/bingo-card-generator/confirm/wtvcdc2/39f90a3ffbba1e0aebd5402b7d5c0fa7";
