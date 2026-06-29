# VIVE 37 Nahual — BINGO

Sistema híbrido de venta y distribución de cartones BINGO (virtual y presencial).

## Stack

- **Frontend:** Next.js 14+ (App Router) + TypeScript + Tailwind — desplegado en [Vercel](https://vercel.com)
- **Backend:** Google Apps Script (Web App)
- **Datos:** Google Spreadsheet + Google Drive

## Estructura

```
├── web/          # Frontend Next.js → Vercel (root directory)
├── gas/          # Google Apps Script (clasp)
├── scripts/      # init-spreadsheet.gs (setup one-time)
├── docs/         # Documentación de despliegue
└── img/          # Logos
```

## Inicio rápido

### 1. Google Spreadsheet + Apps Script

Ver [docs/SPREADSHEET_SETUP.md](docs/SPREADSHEET_SETUP.md)

### 2. Frontend local

```bash
cd web
cp .env.example .env.local
# Editar GAS_WEB_APP_URL con la URL del Web App desplegado
npm install
npm run dev
```

### 3. Vercel

Ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Usuario admin inicial

Tras ejecutar `initNahualSpreadsheet()`:

- **Usuario:** `admin`
- **Contraseña:** `Admin123!`

Cambiar la contraseña después del primer login.

## Rutas públicas

- `/` — Login y registro
- `/formulario` — Compra de cartones (sin navegación a la app)
- `/formulario/exito` — Confirmación de compra

## Licencia

Uso interno — VIVE 37 Nahual
