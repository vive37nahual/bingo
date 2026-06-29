function getWhatsAppUrl(entradaId, token) {
  requirePermission(token, 'bingoVentas_notificaciones');
  var entrada = getEntradaById(entradaId);
  if (!entrada) throw new Error('Entrada no encontrada');
  if (!(entrada.notifyWhatsApp === true || String(entrada.notifyWhatsApp).toUpperCase() === 'TRUE')) {
    throw new Error('Cliente no solicitó notificación por WhatsApp');
  }

  var templates = {};
  sheetToObjects(getSheet(SHEET_NAMES.NOTIFICACIONES)).forEach(function(r) {
    templates[r.clave] = r.valor;
  });

  var modalidad = String(entrada.modalidad).toLowerCase();
  var template = templates['whatsapp_' + modalidad] || '';
  var message = renderTemplate(template, entrada, false);

  var phone = String(entrada.numWA || '').replace(/-/g, '');
  if (phone.length !== 8) throw new Error('Número WhatsApp inválido');

  return {
    url: 'https://wa.me/506' + phone + '?text=' + encodeURIComponent(message),
    message: message
  };
}

function getWhatsAppUrlHistorial(entradaId, token) {
  requirePermission(token, 'bingoVentas_historial');
  return getWhatsAppUrl(entradaId, token);
}

function getWhatsAppPreview(entradaId, token) {
  var result = getWhatsAppUrl(entradaId, token);
  return { message: result.message };
}
