function entradaToObject(row, headers) {
  var obj = {};
  headers.forEach(function(h, i) { obj[h] = row[i]; });
  return obj;
}

function getEntradasByEstado(estado) {
  return sheetToObjects(getSheet(SHEET_NAMES.ENTRADAS))
    .filter(function(e) { return String(e.estado) === estado; })
    .map(formatEntradaForClient);
}

function formatEntradaForClient(e) {
  return {
    entradaID: e.entradaID,
    codigoCompra: e.codigoCompra ? String(e.codigoCompra) : String(e.entradaID),
    fechaRegistro: e.fechaRegistro,
    nombre: e.nombre,
    apellido: e.apellido,
    modalidad: e.modalidad,
    correo: e.correo,
    notifyWhatsApp: e.notifyWhatsApp === true || String(e.notifyWhatsApp).toUpperCase() === 'TRUE',
    numWA: e.numWA || '',
    cantidad: Number(e.cantidad),
    monto: Number(e.monto),
    vendedor: e.vendedor,
    metodo: e.metodo,
    comprobante: e.comprobante,
    estado: e.estado,
    cartonesAsignados: e.cartonesAsignados || '',
    emailEnviado: e.emailEnviado === true || String(e.emailEnviado).toUpperCase() === 'TRUE',
    whatsappEnviado: e.whatsappEnviado === true || String(e.whatsappEnviado).toUpperCase() === 'TRUE',
    myfreebingoListo: e.myfreebingoListo === true || String(e.myfreebingoListo).toUpperCase() === 'TRUE',
    notaRegreso: e.notaRegreso || '',
    fechaCompletada: e.fechaCompletada || ''
  };
}

function submitEntrada(payload) {
  var ip = payload.clientIp || 'unknown';
  if (!checkRateLimit(ip, 5)) throw new Error('Demasiados envíos. Intente más tarde.');

  var required = ['nombre', 'apellido', 'modalidad', 'correo', 'cantidad', 'vendedor', 'metodo'];
  required.forEach(function(f) {
    if (!payload[f] && payload[f] !== 0) throw new Error('Campo requerido: ' + f);
  });

  if (payload.modalidad !== 'Virtual' && payload.modalidad !== 'Presencial') {
    throw new Error('Modalidad inválida');
  }
  if (!isValidEmail(payload.correo)) throw new Error('Correo electrónico inválido');

  var cantidad = Number(payload.cantidad);
  if (cantidad < 1 || cantidad > 20) throw new Error('Cantidad debe ser entre 1 y 20');

  if (payload.notifyWhatsApp) {
    if (!payload.numWA || !/^\d{4}-\d{4}$/.test(payload.numWA)) {
      throw new Error('Número WhatsApp inválido (formato XXXX-XXXX)');
    }
  }

  var precios = getPrecios();
  var monto = precios[String(cantidad)];
  if (!monto) throw new Error('Precio no configurado para ' + cantidad + ' cartones');

  var comprobanteUrl = uploadComprobante(
    payload.comprobanteBase64,
    payload.comprobanteMimeType,
    payload.comprobanteFileName || 'comprobante_' + Date.now()
  );

  var entradaId = getNextId('next_entrada_id');
  var codigoCompra = generateCodigoCompra();

  appendEntradaRow_({
    entradaID: entradaId,
    codigoCompra: codigoCompra,
    fechaRegistro: new Date(),
    nombre: payload.nombre,
    apellido: payload.apellido,
    modalidad: payload.modalidad,
    correo: payload.correo,
    notifyWhatsApp: !!payload.notifyWhatsApp,
    numWA: payload.numWA || '',
    cantidad: cantidad,
    monto: monto,
    vendedor: payload.vendedor,
    metodo: payload.metodo,
    comprobante: comprobanteUrl,
    estado: 'Pendiente',
    cartonesAsignados: '',
    emailEnviado: false,
    whatsappEnviado: false,
    myfreebingoListo: false,
    notaRegreso: '',
    fechaCompletada: ''
  });

  return {
    entradaID: entradaId,
    codigoCompra: codigoCompra,
    nombre: payload.nombre,
    apellido: payload.apellido,
    cantidad: cantidad,
    monto: monto
  };
}

function getEntradasPendientes(token, page, pageSize) {
  requirePermission(token, 'bingoVentas_pendientes');
  var all = getEntradasByEstado('Pendiente');
  return paginate(all, page, pageSize);
}

function getEntradasNotificaciones(token, page, pageSize) {
  requirePermission(token, 'bingoVentas_notificaciones');
  var all = getEntradasByEstado('Aprobada');
  return paginate(all, page, pageSize);
}

function getHistorial(token, page, pageSize) {
  requirePermission(token, 'bingoVentas_historial');
  var all = getEntradasByEstado('Completada');
  return paginate(all, page, pageSize);
}

function paginate(items, page, pageSize) {
  page = Math.max(1, parseInt(page || 1, 10));
  pageSize = parseInt(pageSize || 10, 10);
  var start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page: page,
    pageSize: pageSize,
    totalPages: Math.ceil(items.length / pageSize) || 1
  };
}

function approveEntrada(entradaId, token) {
  requirePermission(token, 'bingoVentas_pendientes');
  var sheet = getSheet(SHEET_NAMES.ENTRADAS);
  var row = findRowByColumn(sheet, 'entradaID', entradaId);
  if (row === -1) throw new Error('Entrada no encontrada');

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
  var entrada = {};
  headers.forEach(function(h, i) { entrada[h] = rowData[i]; });

  if (String(entrada.estado) !== 'Pendiente') throw new Error('La entrada no está pendiente');

  var assigned = assignCartones(entrada);
  updateRowFields(sheet, row, {
    estado: 'Aprobada',
    cartonesAsignados: assigned.join(','),
    notaRegreso: ''
  });

  return { message: 'Entrada aprobada', cartonesAsignados: assigned.join(',') };
}

function rejectEntrada(entradaId, token) {
  requirePermission(token, 'bingoVentas_pendientes');
  var sheet = getSheet(SHEET_NAMES.ENTRADAS);
  var row = findRowByColumn(sheet, 'entradaID', entradaId);
  if (row === -1) throw new Error('Entrada no encontrada');
  updateRowFields(sheet, row, { estado: 'Rechazada' });
  return { message: 'Entrada rechazada' };
}

function returnToPendientes(entradaId, token, nota) {
  requirePermission(token, 'bingoVentas_notificaciones');
  var sheet = getSheet(SHEET_NAMES.ENTRADAS);
  var row = findRowByColumn(sheet, 'entradaID', entradaId);
  if (row === -1) throw new Error('Entrada no encontrada');

  var entrada = sheetToObjects(sheet).find(function(e) { return Number(e.entradaID) === Number(entradaId); });
  releaseCartones(entradaId);

  updateRowFields(sheet, row, {
    estado: 'Pendiente',
    cartonesAsignados: '',
    notaRegreso: nota || 'Esta entrada se regresa por contener errores.',
    emailEnviado: false,
    whatsappEnviado: false
  });
  return { message: 'Entrada regresada a pendientes' };
}

function returnFromHistorial(entradaId, token) {
  requirePermission(token, 'bingoVentas_historial');
  var sheet = getSheet(SHEET_NAMES.ENTRADAS);
  var entrada = sheetToObjects(sheet).find(function(e) { return Number(e.entradaID) === Number(entradaId); });
  if (!entrada) throw new Error('Entrada no encontrada');
  if (entrada.myfreebingoListo === true || String(entrada.myfreebingoListo).toUpperCase() === 'TRUE') {
    throw new Error('No se puede regresar: ya marcado como Listo en MyFreeBingoCards');
  }

  releaseCartones(entradaId);
  var row = findRowByColumn(sheet, 'entradaID', entradaId);
  updateRowFields(sheet, row, {
    estado: 'Pendiente',
    cartonesAsignados: '',
    emailEnviado: false,
    whatsappEnviado: false,
    fechaCompletada: '',
    notaRegreso: 'Regresado desde historial para revisión.'
  });
  return { message: 'Entrada regresada a pendientes' };
}

function markEntradaCompletada(entradaId, token) {
  requirePermission(token, 'bingoVentas_notificaciones');
  var sheet = getSheet(SHEET_NAMES.ENTRADAS);
  var row = findRowByColumn(sheet, 'entradaID', entradaId);
  if (row === -1) throw new Error('Entrada no encontrada');

  var entrada = sheetToObjects(sheet).find(function(e) { return Number(e.entradaID) === Number(entradaId); });
  var needsWa = entrada.notifyWhatsApp === true || String(entrada.notifyWhatsApp).toUpperCase() === 'TRUE';
  var emailOk = entrada.emailEnviado === true || String(entrada.emailEnviado).toUpperCase() === 'TRUE';
  var waOk = !needsWa || (entrada.whatsappEnviado === true || String(entrada.whatsappEnviado).toUpperCase() === 'TRUE');

  if (!emailOk || !waOk) throw new Error('Debe enviar email y confirmar WhatsApp antes de completar');

  updateRowFields(sheet, row, {
    estado: 'Completada',
    fechaCompletada: new Date()
  });
  return { message: 'Entrada completada y movida a historial' };
}

function confirmWhatsAppSent(entradaId, token) {
  requirePermission(token, 'bingoVentas_notificaciones');
  var sheet = getSheet(SHEET_NAMES.ENTRADAS);
  var row = findRowByColumn(sheet, 'entradaID', entradaId);
  if (row === -1) throw new Error('Entrada no encontrada');
  updateRowFields(sheet, row, { whatsappEnviado: true });

  tryCompleteEntrada(entradaId);
  return { message: 'WhatsApp confirmado' };
}

function tryCompleteEntrada(entradaId) {
  var sheet = getSheet(SHEET_NAMES.ENTRADAS);
  var entrada = sheetToObjects(sheet).find(function(e) { return Number(e.entradaID) === Number(entradaId); });
  if (!entrada || String(entrada.estado) !== 'Aprobada') return;

  var needsWa = entrada.notifyWhatsApp === true || String(entrada.notifyWhatsApp).toUpperCase() === 'TRUE';
  var emailOk = entrada.emailEnviado === true || String(entrada.emailEnviado).toUpperCase() === 'TRUE';
  var waOk = !needsWa || (entrada.whatsappEnviado === true || String(entrada.whatsappEnviado).toUpperCase() === 'TRUE');

  if (emailOk && waOk) {
    var row = findRowByColumn(sheet, 'entradaID', entradaId);
    updateRowFields(sheet, row, { estado: 'Completada', fechaCompletada: new Date() });
  }
}

function getMyFreeBingoList(token) {
  requirePermission(token, 'bingoVentas_myfreebingo');
  return sheetToObjects(getSheet(SHEET_NAMES.ENTRADAS))
    .filter(function(e) {
      return String(e.modalidad) === 'Virtual' &&
        (String(e.estado) === 'Aprobada' || String(e.estado) === 'Completada') &&
        e.cartonesAsignados;
    })
    .map(function(e) {
      return {
        entradaID: e.entradaID,
        email: e.correo,
        cantidad: Number(e.cantidad),
        cartones: e.cartonesAsignados,
        listo: e.myfreebingoListo === true || String(e.myfreebingoListo).toUpperCase() === 'TRUE'
      };
    });
}

function markMyFreeBingoListo(entradaId, token) {
  requirePermission(token, 'bingoVentas_myfreebingo');
  var sheet = getSheet(SHEET_NAMES.ENTRADAS);
  var row = findRowByColumn(sheet, 'entradaID', entradaId);
  if (row === -1) throw new Error('Entrada no encontrada');
  updateRowFields(sheet, row, { myfreebingoListo: true });
  return { message: 'Marcado como listo' };
}

function getEntradaById(entradaId) {
  return sheetToObjects(getSheet(SHEET_NAMES.ENTRADAS))
    .find(function(e) { return Number(e.entradaID) === Number(entradaId); });
}
