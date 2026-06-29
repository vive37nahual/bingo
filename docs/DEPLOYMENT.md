# Despliegue — VIVE 37 Nahual BINGO

## Google Apps Script

### Con clasp (recomendado para GitHub)

```bash
npm install -g @google/clasp
clasp login
cd gas
cp .clasp.json.example .clasp.json
# Editar scriptId después de clasp create
clasp push
```

### Crear proyecto vinculado al Spreadsheet

```bash
cd gas
clasp create --type sheets --title "Nahual BINGO API" --rootDir .
clasp push
```

### Script Properties (Proyecto → Configuración → Propiedades del script)

| Propiedad | Descripción |
|-----------|-------------|
| `SPREADSHEET_ID` | ID del documento Spreadsheet |
| `TOKEN_SECRET` | UUID para firmar sesiones (auto-generado por init) |
| `PASSWORD_SALT` | Salt para hash de contraseñas (auto-generado por init) |

### Desplegar Web App

1. **Implementar → Nueva implementación**
2. Tipo: **Aplicación web**
3. Ejecutar como: **Yo**
4. Acceso: **Cualquier persona**
5. Copiar la URL `/exec` → usar como `GAS_WEB_APP_URL`

### Permisos requeridos

- Google Sheets (lectura/escritura)
- Google Drive (subir comprobantes)
- Gmail (enviar correos de confirmación)

---

## Vercel

1. Conectar repositorio GitHub
2. **Root Directory:** `web`
3. Framework: Next.js (auto-detectado)
4. Variables de entorno:
   - `GAS_WEB_APP_URL` = URL del Web App GAS
   - `NEXT_PUBLIC_APP_NAME` = VIVE 37 Nahual
5. Deploy

### vercel.json (opcional, en `web/`)

No es necesario si se configura root directory como `web` en el dashboard.

---

## GitHub Actions (opcional)

Despliegue automático de GAS en push a `main`:

```yaml
# .github/workflows/clasp-push.yml
name: Deploy GAS
on:
  push:
    branches: [main]
    paths: ['gas/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g @google/clasp
      - run: echo '${{ secrets.CLASP_JSON }}' > gas/.clasp.json
      - run: clasp push -f
        working-directory: gas
```

Secrets necesarios: `CLASP_JSON` (contenido de `.clasp.json` + credenciales OAuth).

---

## Checklist post-despliegue

- [ ] Spreadsheet inicializado con `initNahualSpreadsheet`
- [ ] Carpeta Drive configurada en `config`
- [ ] GAS Web App desplegado y URL en Vercel
- [ ] Login admin funciona
- [ ] Formulario público carga precios y equipo
- [ ] Prueba de subida de comprobante
- [ ] Importar cartones CSV de prueba
