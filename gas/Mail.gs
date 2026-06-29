function renderTemplate(template, data, isHtml) {
  var result = template || '';
  var replacements = buildReplacements(data, isHtml);
  Object.keys(replacements).forEach(function(key) {
    result = result.split('{{' + key + '}}').join(replacements[key]);
  });
  return result;
}

function buildReplacements(data, isHtml) {
  var cartones = getCartonesForEntrada(data.entradaID) || [];
  if (cartones.length === 0 && data.cartonesAsignados) {
    var nums = String(data.cartonesAsignados).split(',');
    cartones = nums.map(function(n) {
      return { numero: padCardNumber(n.trim()), linkJuego: '', linkPDF: '' };
    });
  }

  var linkCartones = formatLinkCartones(cartones, isHtml, 'juego');
  var pdfCartones = formatLinkCartones(cartones, isHtml, 'pdf');

  return {
    nombre: data.nombre || '',
    buyerName: data.nombre || '',
    apellido: data.apellido || '',
    numcartones: String(data.cantidad || data.numcartones || ''),
    cartones: String(data.cantidad || data.numcartones || ''),
    pago: formatColones(data.monto || data.pago || 0),
    email: data.correo || data.email || '',
    proofDriveUrl: data.comprobante || data.proofDriveUrl || '',
    linkcartones: linkCartones,
    pdfscartones: pdfCartones
  };
}

function formatLinkCartones(cartones, isHtml, type) {
  if (!cartones.length) return '';
  return cartones.map(function(c) {
    var url = type === 'pdf' ? c.linkPDF : c.linkJuego;
    var label = 'Cartón ' + c.numero;
    if (isHtml && url) {
      return '<a href="' + url + '">' + label + '</a>';
    }
    if (url) return label + ': ' + url;
    return label;
  }).join(isHtml ? '<br>' : '\n');
}

function getNotificationPreview(entradaId, channel, token) {
  requirePermission(token, 'bingoVentas_notificaciones');
  var entrada = getEntradaById(entradaId);
  if (!entrada) throw new Error('Entrada no encontrada');

  var templates = {};
  sheetToObjects(getSheet(SHEET_NAMES.NOTIFICACIONES)).forEach(function(r) {
    templates[r.clave] = r.valor;
  });

  var modalidad = String(entrada.modalidad).toLowerCase();
  var key = channel + '_' + modalidad;
  var template = templates[key] || '';
  var isHtml = channel === 'email';
  return renderTemplate(template, entrada, isHtml);
}

function sendEntradaEmail(entradaId, token) {
  requirePermission(token, 'bingoVentas_notificaciones');
  var entrada = getEntradaById(entradaId);
  if (!entrada) throw new Error('Entrada no encontrada');

  var templates = {};
  sheetToObjects(getSheet(SHEET_NAMES.NOTIFICACIONES)).forEach(function(r) {
    templates[r.clave] = r.valor;
  });

  var modalidad = String(entrada.modalidad).toLowerCase();
  var template = templates['email_' + modalidad] || '';
  var htmlBody = renderTemplate(template, entrada, true);

  MailApp.sendEmail({
    to: entrada.correo,
    subject: 'Confirmación de compra BINGO - VIVE 37 Nahual',
    htmlBody: htmlBody
  });

  var sheet = getSheet(SHEET_NAMES.ENTRADAS);
  var row = findRowByColumn(sheet, 'entradaID', entradaId);
  updateRowFields(sheet, row, { emailEnviado: true });

  tryCompleteEntrada(entradaId);
  return { message: 'Email enviado correctamente' };
}

function resendEntradaEmail(entradaId, token) {
  requirePermission(token, 'bingoVentas_historial');
  return sendEntradaEmail(entradaId, token);
}
