# Configuración del Spreadsheet

## Paso 1: Crear documento

1. Ir a [Google Sheets](https://sheets.google.com)
2. Crear un nuevo documento: **VIVE37_Nahual_BINGO**
3. Abrir **Extensiones → Apps Script**

## Paso 2: Inicializar hojas

1. Copiar el contenido de [`scripts/init-spreadsheet.gs`](../scripts/init-spreadsheet.gs) en el editor
2. Ejecutar la función `initNahualSpreadsheet`
3. Autorizar permisos cuando se solicite

Esto crea las hojas:

| Hoja | Propósito |
|------|-----------|
| `entradas` | Compras del formulario |
| `users` | Usuarios y permisos |
| `precios` | Precios 1–20 cartones |
| `equipo` | Vendedores del dropdown |
| `cartones` | Inventario de cartones |
| `notificaciones` | Plantillas email/WhatsApp |
| `config` | Configuración del sistema |

## Paso 3: Google Drive

1. Crear carpeta **Nahual_Comprobantes**
2. Copiar el ID de la carpeta (de la URL: `folders/XXXXX`)
3. En la hoja `config`, actualizar `drive_folder_id` con ese ID

## Paso 4: Desplegar backend GAS

Ver [DEPLOYMENT.md](DEPLOYMENT.md) sección Google Apps Script.

## Columnas principales — entradas

`entradaID`, `codigoCompra`, `fechaRegistro`, `nombre`, `apellido`, `modalidad`, `correo`, `notifyWhatsApp`, `numWA`, `cantidad`, `monto`, `vendedor`, `metodo`, `comprobante`, `estado`, `cartonesAsignados`, `emailEnviado`, `whatsappEnviado`, `myfreebingoListo`, `notaRegreso`, `fechaCompletada`

## Login admin no funciona — diagnóstico

**Credenciales iniciales (exactas, sensibles a mayúsculas):**

| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contraseña | `Admin123!` |

**Causas frecuentes:**

1. **Registro nuevo:** los usuarios que se registran en la web quedan en estado `Pendiente` hasta que un admin los aprueba en Admin Console → Usuarios. No pueden iniciar sesión antes.
2. **Vercel sin backend:** si falta `GAS_WEB_APP_URL` en Vercel → Settings → Environment Variables, el login falla. Redespliega después de agregarla.
3. **Hash desincronizado:** si ejecutaste `initNahualSpreadsheet()` más de una vez, el salt pudo cambiar. En Apps Script ejecuta `repairAdminUser()` y vuelve a intentar.
4. **Web App desactualizada:** después de `clasp push`, crea una **nueva implementación** del Web App y actualiza la URL en Vercel.

**Verificar conexión:** en [tu sitio]/api/gas el login debe responder `success: true` al enviar `admin` / `Admin123!`.

## Estados de entradas

| Estado | Significado |
|--------|-------------|
| `Pendiente` | Enviado, esperando revisión |
| `Aprobada` | Aprobado, en cola de notificaciones |
| `Rechazada` | Rechazado |
| `Completada` | Notificaciones enviadas → Historial |
