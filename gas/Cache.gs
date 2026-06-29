function getCachedFormConfig() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('form_config');
  if (cached) return JSON.parse(cached);

  var config = {
    precios: getPrecios(),
    equipo: getEquipoActivo(),
    sinpe: {
      numero: getConfigValue('sinpe_numero') || '61844935',
      nombre: getConfigValue('sinpe_nombre') || 'Roberto Orozco Villalobos'
    },
    iban: getConfigValue('iban') || 'CR18081400011020271366'
  };

  cache.put('form_config', JSON.stringify(config), 300);
  return config;
}

function invalidateFormConfigCache() {
  CacheService.getScriptCache().remove('form_config');
}

function getPrecios() {
  var rows = sheetToObjects(getSheet(SHEET_NAMES.PRECIOS));
  var map = {};
  rows.forEach(function(r) {
    map[String(r.cartones)] = Number(r.precio);
  });
  return map;
}

function getEquipoActivo() {
  return sheetToObjects(getSheet(SHEET_NAMES.EQUIPO))
    .filter(function(e) { return e.activo === true || String(e.activo).toUpperCase() === 'TRUE'; })
    .map(function(e) { return { id: e.id, nombre: e.nombre }; });
}

function savePrecios(precios, token) {
  requirePermission(token, 'bingoAdmin_precios');
  var sheet = getSheet(SHEET_NAMES.PRECIOS);
  sheet.getRange(2, 1, 20, 2).clearContent();
  for (var i = 1; i <= 20; i++) {
    var row = i + 1;
    sheet.getRange(row, 1).setValue(i);
    sheet.getRange(row, 2).setValue(Number(precios[String(i)] || precios[i] || 0));
  }
  invalidateFormConfigCache();
  return { message: 'Precios actualizados' };
}

function getEquipoAll(token) {
  requirePermission(token, 'bingoAdmin_equipo');
  return sheetToObjects(getSheet(SHEET_NAMES.EQUIPO));
}

function saveEquipo(equipo, token) {
  requirePermission(token, 'bingoAdmin_equipo');
  var sheet = getSheet(SHEET_NAMES.EQUIPO);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 3).clearContent();
  equipo.forEach(function(m, idx) {
    sheet.getRange(idx + 2, 1, 1, 3).setValues([[idx + 1, m.nombre, m.activo !== false]]);
  });
  invalidateFormConfigCache();
  return { message: 'Equipo actualizado' };
}

function getNotificaciones(token) {
  requirePermission(token, 'bingoAdmin_notificaciones');
  var rows = sheetToObjects(getSheet(SHEET_NAMES.NOTIFICACIONES));
  var result = {};
  rows.forEach(function(r) { result[r.clave] = r.valor; });
  return result;
}

function saveNotificaciones(templates, token) {
  requirePermission(token, 'bingoAdmin_notificaciones');
  var sheet = getSheet(SHEET_NAMES.NOTIFICACIONES);
  var keys = ['email_virtual', 'email_presencial', 'whatsapp_virtual', 'whatsapp_presencial'];
  keys.forEach(function(key) {
    var row = findRowByColumn(sheet, 'clave', key);
    if (row === -1) {
      sheet.appendRow([key, templates[key] || '']);
    } else {
      updateRowFields(sheet, row, { valor: templates[key] || '' });
    }
  });
  return { message: 'Plantillas guardadas' };
}

function previewNotification(templateKey, sampleData, token) {
  requirePermission(token, 'bingoAdmin_notificaciones');
  var templates = getNotificaciones(token);
  var template = templates[templateKey] || '';
  return renderTemplate(template, sampleData || getSampleNotificationData(), templateKey.indexOf('email') === 0);
}

function getSampleNotificationData() {
  return {
    nombre: 'Juan',
    apellido: 'Pérez',
    numcartones: 3,
    cartones: 3,
    pago: formatColones(4500),
    email: 'juan@ejemplo.com',
    proofDriveUrl: 'https://drive.google.com/example',
    linkcartones: 'Cartón 001: https://example.com/001\nCartón 002: https://example.com/002',
    pdfscartones: 'PDF 001: https://example.com/pdf001'
  };
}
