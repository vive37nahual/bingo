/**
 * One-time setup script. Run from Apps Script editor bound to a new Spreadsheet.
 * Creates all sheets, headers, default data, and admin user.
 */
function initNahualSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  createSheetWithHeaders_(ss, 'entradas', [
    'entradaID', 'codigoCompra', 'fechaRegistro', 'nombre', 'apellido', 'modalidad', 'correo',
    'notifyWhatsApp', 'numWA', 'cantidad', 'monto', 'vendedor', 'metodo',
    'comprobante', 'estado', 'cartonesAsignados', 'emailEnviado', 'whatsappEnviado',
    'myfreebingoListo', 'notaRegreso', 'fechaCompletada'
  ]);

  createSheetWithHeaders_(ss, 'users', [
    'userID', 'nombre', 'apellido', 'user', 'passwordHash', 'email',
    'estado', 'admin', 'permissions'
  ]);

  createSheetWithHeaders_(ss, 'precios', ['cartones', 'precio']);
  var preciosSheet = ss.getSheetByName('precios');
  for (var i = 1; i <= 20; i++) {
    preciosSheet.appendRow([i, i * 1500]);
  }

  createSheetWithHeaders_(ss, 'equipo', ['id', 'nombre', 'activo']);
  ss.getSheetByName('equipo').appendRow([1, 'Roberto Orozco Villalobos', true]);

  createSheetWithHeaders_(ss, 'cartones', [
    'numero', 'linkJuego', 'linkPDF', 'estado', 'entradaID', 'comprador', 'vendedor'
  ]);

  createSheetWithHeaders_(ss, 'notificaciones', ['clave', 'valor']);
  var notifSheet = ss.getSheetByName('notificaciones');
  var defaultTemplates = [
    ['email_virtual', '<h2>Gracias {{nombre}}!</h2><p>Has comprado {{numcartones}} cartón(es) por {{pago}}.</p><p>{{linkcartones}}</p><p>{{pdfscartones}}</p>'],
    ['email_presencial', '<h2>Gracias {{nombre}}!</h2><p>Tus {{numcartones}} cartón(es) presenciales han sido confirmados por {{pago}}.</p>'],
    ['whatsapp_virtual', 'Hola {{nombre}}, gracias por tu compra de {{numcartones}} cartón(es) por {{pago}}.\n{{linkcartones}}'],
    ['whatsapp_presencial', 'Hola {{nombre}}, tus {{numcartones}} cartón(es) presenciales están confirmados. Monto: {{pago}}.']
  ];
  defaultTemplates.forEach(function(row) { notifSheet.appendRow(row); });

  createSheetWithHeaders_(ss, 'config', ['clave', 'valor']);
  var configSheet = ss.getSheetByName('config');
  var configDefaults = [
    ['spreadsheet_id', ss.getId()],
    ['sinpe_numero', '61844935'],
    ['sinpe_nombre', 'Roberto Orozco Villalobos'],
    ['iban', 'CR18081400011020271366'],
    ['drive_folder_id', ''],
    ['next_entrada_id', '1'],
    ['next_user_id', '2']
  ];
  configDefaults.forEach(function(row) { configSheet.appendRow(row); });

  // Admin user: admin / Admin123! (change after first login)
  var salt = Utilities.getUuid();
  var adminHash = hashPasswordInit_('Admin123!', salt);
  ss.getSheetByName('users').appendRow([
    1, 'Administrador', 'Nahual', 'admin', adminHash, 'admin@nahual37.local',
    'Aprobado', true, JSON.stringify(getAllPermissionsTrue_())
  ]);

  PropertiesService.getScriptProperties().setProperties({
    'TOKEN_SECRET': Utilities.getUuid(),
    'PASSWORD_SALT': salt,
    'SPREADSHEET_ID': ss.getId()
  });

  SpreadsheetApp.getUi().alert('Spreadsheet inicializado correctamente.\n\nUsuario admin: admin\nContraseña: Admin123!\n\nCambia la contraseña después del primer login.');
}

function createSheetWithHeaders_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function hashPasswordInit_(password, salt) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt);
  return Utilities.base64Encode(raw);
}

function getAllPermissionsTrue_() {
  return {
    bingoAdmin_precios: true,
    bingoAdmin_equipo: true,
    bingoAdmin_cartones: true,
    bingoAdmin_notificaciones: true,
    bingoVentas_pendientes: true,
    bingoVentas_notificaciones: true,
    bingoVentas_myfreebingo: true,
    bingoVentas_historial: true,
    admin_usuarios: true,
    admin_permisos: true
  };
}
