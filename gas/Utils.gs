var SHEET_NAMES = {
  ENTRADAS: 'entradas',
  USERS: 'users',
  PRECIOS: 'precios',
  EQUIPO: 'equipo',
  CARTONES: 'cartones',
  NOTIFICACIONES: 'notificaciones',
  CONFIG: 'config'
};

function getSpreadsheet() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) {
    var configVal = getConfigValue('spreadsheet_id');
    if (configVal) id = configVal;
  }
  if (!id) {
    throw new Error('SPREADSHEET_ID no configurado en Script Properties');
  }
  return SpreadsheetApp.openById(id);
}

function getSheet(name) {
  var sheet = getSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Hoja no encontrada: ' + name);
  return sheet;
}

function getConfigValue(key) {
  var sheet = getSheet(SHEET_NAMES.CONFIG);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) return data[i][1];
  }
  return null;
}

function setConfigValue(key, value) {
  var sheet = getSheet(SHEET_NAMES.CONFIG);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

function getNextId(configKey) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var current = parseInt(getConfigValue(configKey) || '1', 10);
    setConfigValue(configKey, String(current + 1));
    return current;
  } finally {
    lock.releaseLock();
  }
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

function findRowByColumn(sheet, columnName, value) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var colIndex = headers.indexOf(columnName);
  if (colIndex === -1) return -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]) === String(value)) return i + 1;
  }
  return -1;
}

function updateRowFields(sheet, rowNum, updates) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Object.keys(updates).forEach(function(key) {
    var col = headers.indexOf(key);
    if (col !== -1) {
      sheet.getRange(rowNum, col + 1).setValue(updates[key]);
    }
  });
}

function jsonResponse(data, statusCode) {
  statusCode = statusCode || 200;
  var output = ContentService.createTextOutput(JSON.stringify({
    success: statusCode >= 200 && statusCode < 300,
    status: statusCode,
    data: data
  }));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function errorResponse(message, statusCode) {
  statusCode = statusCode || 400;
  return jsonResponse({ error: message }, statusCode);
}

function parseRequestBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Cuerpo de solicitud vacío');
  }
  return JSON.parse(e.postData.contents);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function formatColones(amount) {
  return '₡' + Number(amount).toLocaleString('es-CR');
}

function padCardNumber(num) {
  return String(num).padStart(3, '0');
}

function getDefaultPermissions() {
  return {
    bingoAdmin_precios: false,
    bingoAdmin_equipo: false,
    bingoAdmin_cartones: false,
    bingoAdmin_notificaciones: false,
    bingoVentas_pendientes: false,
    bingoVentas_notificaciones: false,
    bingoVentas_myfreebingo: false,
    bingoVentas_historial: false,
    admin_usuarios: false,
    admin_permisos: false
  };
}

function parsePermissions(jsonStr) {
  try {
    var parsed = JSON.parse(jsonStr || '{}');
    var defaults = getDefaultPermissions();
    Object.keys(defaults).forEach(function(k) {
      if (parsed[k] !== undefined) defaults[k] = !!parsed[k];
    });
    return defaults;
  } catch (err) {
    return getDefaultPermissions();
  }
}

function checkRateLimit(identifier, maxPerHour) {
  maxPerHour = maxPerHour || 5;
  var cache = CacheService.getScriptCache();
  var key = 'rate_' + identifier;
  var count = parseInt(cache.get(key) || '0', 10);
  if (count >= maxPerHour) return false;
  cache.put(key, String(count + 1), 3600);
  return true;
}
