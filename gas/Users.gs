function getPendingUsers(token) {
  requirePermission(token, 'admin_usuarios');
  return sheetToObjects(getSheet(SHEET_NAMES.USERS))
    .filter(function(u) { return String(u.estado) === 'Pendiente'; })
    .map(formatUserForClient);
}

function getAllUsers(token) {
  requirePermission(token, 'admin_permisos');
  return sheetToObjects(getSheet(SHEET_NAMES.USERS))
    .filter(function(u) { return String(u.estado) === 'Aprobado'; })
    .map(formatUserForClient);
}

function formatUserForClient(u) {
  return {
    userID: u.userID,
    nombre: u.nombre,
    apellido: u.apellido,
    user: u.user,
    email: u.email,
    estado: u.estado,
    admin: u.admin === true || String(u.admin).toUpperCase() === 'TRUE',
    permissions: parsePermissions(u.permissions),
    hasPassword: !!u.passwordHash
  };
}

function approveUser(userId, permissions, token) {
  requirePermission(token, 'admin_usuarios');
  var sheet = getSheet(SHEET_NAMES.USERS);
  var row = findRowByColumn(sheet, 'userID', userId);
  if (row === -1) throw new Error('Usuario no encontrado');

  updateRowFields(sheet, row, {
    estado: 'Aprobado',
    permissions: JSON.stringify(permissions || getDefaultPermissions())
  });
  return { message: 'Usuario aprobado' };
}

function rejectUser(userId, token) {
  requirePermission(token, 'admin_usuarios');
  var sheet = getSheet(SHEET_NAMES.USERS);
  var row = findRowByColumn(sheet, 'userID', userId);
  if (row === -1) throw new Error('Usuario no encontrado');
  updateRowFields(sheet, row, { estado: 'Rechazado' });
  return { message: 'Usuario rechazado' };
}

function updateUserPermissions(userId, permissions, token) {
  requirePermission(token, 'admin_permisos');
  var sheet = getSheet(SHEET_NAMES.USERS);
  var row = findRowByColumn(sheet, 'userID', userId);
  if (row === -1) throw new Error('Usuario no encontrado');
  updateRowFields(sheet, row, { permissions: JSON.stringify(permissions) });
  return { message: 'Permisos actualizados' };
}

function updateUserInfo(userId, updates, token) {
  requirePermission(token, 'admin_permisos');
  var sheet = getSheet(SHEET_NAMES.USERS);
  var row = findRowByColumn(sheet, 'userID', userId);
  if (row === -1) throw new Error('Usuario no encontrado');

  var allowed = {};
  if (updates.nombre) allowed.nombre = updates.nombre;
  if (updates.apellido) allowed.apellido = updates.apellido;
  if (updates.user) allowed.user = updates.user;
  if (updates.email) allowed.email = updates.email;
  updateRowFields(sheet, row, allowed);
  return { message: 'Usuario actualizado' };
}

function getPermissionLabels() {
  return [
    { key: 'bingoAdmin_precios', label: '1.1) Precios', group: 'BINGO Admin' },
    { key: 'bingoAdmin_equipo', label: '1.2) Equipo', group: 'BINGO Admin' },
    { key: 'bingoAdmin_cartones', label: '1.3) Cartones', group: 'BINGO Admin' },
    { key: 'bingoAdmin_notificaciones', label: '1.4) Notificaciones', group: 'BINGO Admin' },
    { key: 'bingoVentas_pendientes', label: '2.1) Pendientes', group: 'BINGO Ventas' },
    { key: 'bingoVentas_notificaciones', label: '2.2) Notificaciones', group: 'BINGO Ventas' },
    { key: 'bingoVentas_myfreebingo', label: '2.3) MyFreeBingoCards', group: 'BINGO Ventas' },
    { key: 'bingoVentas_historial', label: '2.4) Historial', group: 'BINGO Ventas' },
    { key: 'admin_usuarios', label: '3.1) Usuarios', group: 'Admin Console' },
    { key: 'admin_permisos', label: '3.2) Permisos', group: 'Admin Console' }
  ];
}
