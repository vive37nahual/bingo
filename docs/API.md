# API — Google Apps Script

Todas las peticiones van a `POST /api/gas` (proxy Vercel) con body:

```json
{
  "action": "nombreAccion",
  "token": "opcional — Bearer session token",
  "payload": {}
}
```

Respuesta:

```json
{
  "success": true,
  "status": 200,
  "data": { }
}
```

Error:

```json
{
  "success": false,
  "status": 400,
  "data": { "error": "mensaje" }
}
```

## Acciones públicas

| Action | Payload | Retorna |
|--------|---------|---------|
| `getFormConfig` | — | precios, equipo, sinpe, iban |
| `submitEntrada` | datos formulario + comprobanteBase64 | entradaID, nombre, etc. |
| `registerUser` | nombre, apellido, user, email, password... | message |
| `login` | login, password | token, user, permissions |

## Ventas

| Action | Permiso |
|--------|---------|
| `getEntradasPendientes` | bingoVentas_pendientes |
| `approveEntrada` | bingoVentas_pendientes |
| `rejectEntrada` | bingoVentas_pendientes |
| `getEntradasNotificaciones` | bingoVentas_notificaciones |
| `sendEmail` | bingoVentas_notificaciones |
| `confirmWhatsApp` | bingoVentas_notificaciones |
| `getWhatsAppUrl` | bingoVentas_notificaciones |
| `returnToPendientes` | bingoVentas_notificaciones |
| `getHistorial` | bingoVentas_historial |
| `returnFromHistorial` | bingoVentas_historial |
| `getMyFreeBingoList` | bingoVentas_myfreebingo |
| `markMyFreeBingoListo` | bingoVentas_myfreebingo |

## Admin

| Action | Permiso |
|--------|---------|
| `getPrecios` / `savePrecios` | bingoAdmin_precios |
| `getEquipo` / `saveEquipo` | bingoAdmin_equipo |
| `getCartones` / `importCartones` / `exportCartones` | bingoAdmin_cartones |
| `getNotificaciones` / `saveNotificaciones` | bingoAdmin_notificaciones |
| `getPendingUsers` / `approveUser` / `rejectUser` | admin_usuarios |
| `getAllUsers` / `updateUserPermissions` / `resetUserPassword` | admin_permisos |

## Dashboard

| Action | Auth |
|--------|------|
| `getDashboard` | cualquier usuario aprobado |
| `exportDashboardCSV` | cualquier usuario aprobado |
| `getPresenciales` | cualquier usuario aprobado |

## Variables de plantillas

`{{nombre}}`, `{{numcartones}}`, `{{pago}}`, `{{linkcartones}}`, `{{pdfscartones}}`, `{{email}}`, `{{buyerName}}`, `{{cartones}}`, `{{proofDriveUrl}}`
