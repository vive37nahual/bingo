function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'VIVE 37 Nahual BINGO API' });
}

function doPost(e) {
  try {
    var body = parseRequestBody(e);
    var action = body.action;
    var token = body.token || (e.parameter && e.parameter.token);
    var payload = body.payload || {};

    var result = routeAction(action, token, payload);
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err.message || String(err), 400);
  }
}

function routeAction(action, token, payload) {
  switch (action) {
    // Public
    case 'getFormConfig':
      return getCachedFormConfig();
    case 'submitEntrada':
      return submitEntrada(payload);
    case 'registerUser':
      return registerUser(payload);
    case 'login':
      return authenticateUser(payload);
    case 'updateMyUsername':
      return updateMyUsername(token, payload.newUsername);

    // Entradas / Ventas
    case 'getEntradasPendientes':
      return getEntradasPendientes(token, payload.page, payload.pageSize);
    case 'getEntradasNotificaciones':
      return getEntradasNotificaciones(token, payload.page, payload.pageSize);
    case 'getHistorial':
      return getHistorial(token, payload.page, payload.pageSize);
    case 'approveEntrada':
      return approveEntrada(payload.entradaId, token);
    case 'rejectEntrada':
      return rejectEntrada(payload.entradaId, token);
    case 'returnToPendientes':
      return returnToPendientes(payload.entradaId, token, payload.nota);
    case 'returnFromHistorial':
      return returnFromHistorial(payload.entradaId, token);
    case 'sendEmail':
      return sendEntradaEmail(payload.entradaId, token);
    case 'resendEmail':
      return resendEntradaEmail(payload.entradaId, token);
    case 'confirmWhatsApp':
      return confirmWhatsAppSent(payload.entradaId, token);
    case 'getEmailPreview':
      return getNotificationPreview(payload.entradaId, 'email', token);
    case 'getWhatsAppPreview':
      return getWhatsAppPreview(payload.entradaId, token);
    case 'getWhatsAppUrl':
      return getWhatsAppUrl(payload.entradaId, token);
    case 'getWhatsAppUrlHistorial':
      return getWhatsAppUrlHistorial(payload.entradaId, token);
    case 'getMyFreeBingoList':
      return getMyFreeBingoList(token);
    case 'markMyFreeBingoListo':
      return markMyFreeBingoListo(payload.entradaId, token);

    // Admin - Precios, Equipo, Cartones, Notificaciones
    case 'getPrecios':
      requirePermission(token, 'bingoAdmin_precios');
      return getPrecios();
    case 'savePrecios':
      return savePrecios(payload.precios, token);
    case 'getEquipo':
      return getEquipoAll(token);
    case 'saveEquipo':
      return saveEquipo(payload.equipo, token);
    case 'getCartones':
      return getCartones(token);
    case 'importCartones':
      return importCartonesCSV(payload.csv, token, payload.append);
    case 'exportCartones':
      return exportCartonesCSV(token);
    case 'getCartonesTemplate':
      return getCartonesTemplate();
    case 'getNotificaciones':
      return getNotificaciones(token);
    case 'saveNotificaciones':
      return saveNotificaciones(payload.templates, token);
    case 'previewNotification':
      return previewNotification(payload.templateKey, payload.sampleData, token);

    // Dashboard
    case 'getDashboard':
      return getDashboardData(token, payload.filters);
    case 'exportDashboardCSV':
      return exportDashboardCSV(token, payload.filters);
    case 'getPresenciales':
      return getPresenciales(token);
    case 'exportHistorialCSV':
      return exportHistorialCSV(token);

    // Users
    case 'getPendingUsers':
      return getPendingUsers(token);
    case 'getAllUsers':
      return getAllUsers(token);
    case 'approveUser':
      return approveUser(payload.userId, payload.permissions, token);
    case 'rejectUser':
      return rejectUser(payload.userId, token);
    case 'updateUserPermissions':
      return updateUserPermissions(payload.userId, payload.permissions, token);
    case 'updateUserInfo':
      return updateUserInfo(payload.userId, payload.updates, token);
    case 'resetUserPassword':
      return resetUserPassword(payload.userId, payload.newPassword, token);
    case 'getPermissionLabels':
      requireAuth(token);
      return getPermissionLabels();
    case 'validateSession':
      return requireAuth(token);

    default:
      throw new Error('Acción no reconocida: ' + action);
  }
}

function testApi() {
  Logger.log(getCachedFormConfig());
}
