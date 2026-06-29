function uploadComprobante(base64Data, mimeType, fileName) {
  if (!base64Data) throw new Error('Archivo de comprobante requerido');

  var allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif',
    'image/webp', 'application/pdf'
  ];
  if (allowedTypes.indexOf(mimeType) === -1) {
    throw new Error('Tipo de archivo no permitido');
  }

  var folderId = getConfigValue('drive_folder_id');
  var folder;
  if (folderId) {
    folder = DriveApp.getFolderById(folderId);
  } else {
    folder = DriveApp.getRootFolder();
  }

  var bytes = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(bytes, mimeType, fileName || 'comprobante');
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}
