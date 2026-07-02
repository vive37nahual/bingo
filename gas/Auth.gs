function hashPassword(password) {
  var salt = PropertiesService.getScriptProperties().getProperty('PASSWORD_SALT') || '';
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt);
  return Utilities.base64Encode(raw);
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function createToken(userId, username) {
  var secret = PropertiesService.getScriptProperties().getProperty('TOKEN_SECRET');
  var expires = Date.now() + (8 * 60 * 60 * 1000);
  var payload = userId + '|' + username + '|' + expires;
  var sig = Utilities.computeHmacSha256Signature(payload, secret);
  var token = Utilities.base64EncodeWebSafe(Utilities.newBlob(payload).getBytes()) + '.' +
    Utilities.base64EncodeWebSafe(sig);
  return token;
}

function validateToken(token) {
  if (!token) return null;
  try {
    var parts = token.split('.');
    if (parts.length !== 2) return null;
    var payload = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString();
    var secret = PropertiesService.getScriptProperties().getProperty('TOKEN_SECRET');
    var expectedSig = Utilities.computeHmacSha256Signature(payload, secret);
    var actualSig = Utilities.base64DecodeWebSafe(parts[1]);
    if (actualSig.length !== expectedSig.length) return null;
    for (var i = 0; i < expectedSig.length; i++) {
      if (expectedSig[i] !== actualSig[i]) return null;
    }
    var segments = payload.split('|');
    if (parseInt(segments[2], 10) < Date.now()) return null;
    return { userId: parseInt(segments[0], 10), username: segments[1] };
  } catch (err) {
    return null;
  }
}

function getUserById(userId) {
  var users = sheetToObjects(getSheet(SHEET_NAMES.USERS));
  return users.find(function(u) { return Number(u.userID) === Number(userId); }) || null;
}

function getUserByLogin(login) {
  var users = sheetToObjects(getSheet(SHEET_NAMES.USERS));
  var normalized = String(login || '').trim().toLowerCase();
  return users.find(function(u) {
    return String(u.user).toLowerCase() === normalized ||
      String(u.email).toLowerCase() === normalized;
  }) || null;
}

function authenticateUser(payload) {
  var login = payload.login || payload.user || payload.email;
  var password = payload.password;
  if (!login || !password) throw new Error('Usuario y contraseña requeridos');

  var user = getUserByLogin(login);
  if (!user) throw new Error('Credenciales inválidas');
  if (String(user.estado) !== 'Aprobado') throw new Error('Usuario no aprobado o pendiente de revisión');
  if (!verifyPassword(password, user.passwordHash)) throw new Error('Credenciales inválidas');

  var permissions = parsePermissions(user.permissions);
  if (user.admin === true || String(user.admin).toUpperCase() === 'TRUE') {
    Object.keys(permissions).forEach(function(k) { permissions[k] = true; });
  }

  var token = createToken(user.userID, user.user);
  return {
    token: token,
    user: {
      userID: user.userID,
      nombre: user.nombre,
      apellido: user.apellido,
      user: user.user,
      email: user.email,
      admin: user.admin === true || String(user.admin).toUpperCase() === 'TRUE'
    },
    permissions: permissions
  };
}

function requireAuth(token) {
  var session = validateToken(token);
  if (!session) throw new Error('Sesión inválida o expirada');
  var user = getUserById(session.userId);
  if (!user || String(user.estado) !== 'Aprobado') throw new Error('Usuario no autorizado');
  var permissions = parsePermissions(user.permissions);
  var isAdmin = user.admin === true || String(user.admin).toUpperCase() === 'TRUE';
  if (isAdmin) {
    Object.keys(permissions).forEach(function(k) { permissions[k] = true; });
  }
  return { user: user, permissions: permissions, isAdmin: isAdmin };
}

function getOptionalAuth_(token) {
  if (!token) return null;
  try {
    return requireAuth(token);
  } catch (err) {
    return null;
  }
}

function requirePermission(token, permissionKey) {
  var auth = requireAuth(token);
  if (!auth.isAdmin && !auth.permissions[permissionKey]) {
    throw new Error('No tiene permiso para esta acción');
  }
  return auth;
}

function registerUser(payload) {
  var required = ['nombre', 'apellido', 'user', 'email', 'password'];
  required.forEach(function(field) {
    if (!payload[field]) throw new Error('Campo requerido: ' + field);
  });
  if (payload.email !== payload.confirmEmail) throw new Error('Los correos no coinciden');
  if (payload.password !== payload.confirmPassword) throw new Error('Las contraseñas no coinciden');
  if (!isValidEmail(payload.email)) throw new Error('Correo electrónico inválido');

  if (getUserByLogin(payload.user) || getUserByLogin(payload.email)) {
    throw new Error('Usuario o correo ya registrado');
  }

  var userId = getNextId('next_user_id');
  getSheet(SHEET_NAMES.USERS).appendRow([
    userId,
    payload.nombre,
    payload.apellido,
    payload.user,
    hashPassword(payload.password),
    payload.email,
    'Pendiente',
    false,
    JSON.stringify(getDefaultPermissions())
  ]);

  return { message: 'Solicitud registrada. Pendiente de aprobación por un administrador.' };
}

/**
 * Ejecutar una vez desde el editor de Apps Script si el login admin falla
 * (p. ej. si se ejecutó init dos veces y el salt ya no coincide con el hash).
 */
function repairAdminUser() {
  var props = PropertiesService.getScriptProperties();
  var salt = props.getProperty('PASSWORD_SALT');
  if (!salt) {
    salt = Utilities.getUuid();
    props.setProperty('PASSWORD_SALT', salt);
  }
  if (!props.getProperty('TOKEN_SECRET')) {
    props.setProperty('TOKEN_SECRET', Utilities.getUuid());
  }

  var sheet = getSheet(SHEET_NAMES.USERS);
  var row = findRowByColumn(sheet, 'user', 'admin');
  var hash = hashPassword('Admin123!');

  if (row === -1) {
    sheet.appendRow([
      1, 'Administrador', 'Nahual', 'admin', hash, 'admin@nahual37.local',
      'Aprobado', true, JSON.stringify({
        bingoAdmin_precios: true, bingoAdmin_equipo: true, bingoAdmin_cartones: true,
        bingoAdmin_notificaciones: true, bingoVentas_pendientes: true,
        bingoVentas_notificaciones: true, bingoVentas_myfreebingo: true,
        bingoVentas_historial: true, admin_usuarios: true, admin_permisos: true
      })
    ]);
  } else {
    updateRowFields(sheet, row, {
      passwordHash: hash,
      estado: 'Aprobado',
      admin: true
    });
  }

  Logger.log('Admin reparado. Usuario: admin | Contraseña: Admin123!');
  return 'Admin reparado. Usuario: admin | Contraseña: Admin123!';
}

function updateMyUsername(token, newUsername) {
  var auth = requireAuth(token);
  var username = String(newUsername || '').trim();
  if (!username) throw new Error('Nombre de usuario requerido');
  if (username.length < 3) throw new Error('El usuario debe tener al menos 3 caracteres');

  var existing = getUserByLogin(username);
  if (existing && Number(existing.userID) !== Number(auth.user.userID)) {
    throw new Error('Ese nombre de usuario ya está en uso');
  }

  var sheet = getSheet(SHEET_NAMES.USERS);
  var row = findRowByColumn(sheet, 'userID', auth.user.userID);
  if (row === -1) throw new Error('Usuario no encontrado');

  updateRowFields(sheet, row, { user: username });
  return { user: username, message: 'Nombre de usuario actualizado' };
}

function resetUserPassword(userId, newPassword, token) {
  requirePermission(token, 'admin_permisos');
  var sheet = getSheet(SHEET_NAMES.USERS);
  var row = findRowByColumn(sheet, 'userID', userId);
  if (row === -1) throw new Error('Usuario no encontrado');
  updateRowFields(sheet, row, { passwordHash: hashPassword(newPassword) });
  return { message: 'Contraseña actualizada' };
}
