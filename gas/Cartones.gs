function getCartonesSheetData() {
  return sheetToObjects(getSheet(SHEET_NAMES.CARTONES));
}

function getCartones(token) {
  requirePermission(token, 'bingoAdmin_cartones');
  return getCartonesSheetData();
}

function importCartonesCSV(csvContent, token, append) {
  requirePermission(token, 'bingoAdmin_cartones');
  var lines = csvContent.split(/\r?\n/).filter(function(l) { return l.trim(); });
  if (lines.length < 2) throw new Error('CSV vacío o sin datos');

  var headers = parseCSVLine_(lines[0]).map(function(h) { return h.trim().toLowerCase(); });
  var numIdx = headers.indexOf('n.°') !== -1 ? headers.indexOf('n.°') :
    (headers.indexOf('numero') !== -1 ? headers.indexOf('numero') : headers.indexOf('n'));
  var juegoIdx = headers.indexOf('link juego') !== -1 ? headers.indexOf('link juego') : headers.indexOf('linkjuego');
  var pdfIdx = headers.indexOf('link pdf') !== -1 ? headers.indexOf('link pdf') : headers.indexOf('linkpdf');

  if (numIdx === -1 || juegoIdx === -1 || pdfIdx === -1) {
    throw new Error('CSV debe tener columnas: N.°, Link juego, Link PDF');
  }

  var sheet = getSheet(SHEET_NAMES.CARTONES);
  if (!append) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
  }

  var existing = append ? getCartonesSheetData() : [];
  var existingNums = existing.map(function(c) { return padCardNumber(c.numero); });

  for (var i = 1; i < lines.length; i++) {
    var cols = parseCSVLine_(lines[i]);
    var numero = padCardNumber(cols[numIdx]);
    if (existingNums.indexOf(numero) !== -1) continue;

    sheet.appendRow([
      numero,
      cols[juegoIdx] || '',
      cols[pdfIdx] || '',
      'Disponible',
      '',
      '',
      ''
    ]);
    existingNums.push(numero);
  }

  return { message: 'Cartones importados correctamente', total: sheet.getLastRow() - 1 };
}

function parseCSVLine_(line) {
  var result = [];
  var current = '';
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function exportCartonesCSV(token) {
  requirePermission(token, 'bingoAdmin_cartones');
  var cartones = getCartonesSheetData();
  var lines = ['N.°,Link juego,Link PDF'];
  cartones.forEach(function(c) {
    lines.push([c.numero, c.linkJuego, c.linkPDF].join(','));
  });
  return { csv: lines.join('\n') };
}

function getCartonesTemplate() {
  return { csv: 'N.°,Link juego,Link PDF\n001,https://example.com/juego,https://example.com/pdf' };
}

function assignCartones(entrada) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet(SHEET_NAMES.CARTONES);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var estadoCol = headers.indexOf('estado');
    var numCol = headers.indexOf('numero');
    var juegoCol = headers.indexOf('linkJuego');
    var pdfCol = headers.indexOf('linkPDF');

    var cartones = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][estadoCol]) !== 'Disponible') continue;
      cartones.push({
        numero: padCardNumber(data[i][numCol]),
        linkJuego: data[i][juegoCol],
        linkPDF: data[i][pdfCol],
        row: i + 1
      });
    }

    var cantidad = Number(entrada.cantidad);
    if (cartones.length < cantidad) {
      throw new Error('No hay suficientes cartones disponibles (' + cartones.length + ' disponibles, ' + cantidad + ' requeridos)');
    }

    cartones.sort(function(a, b) {
      return Number(a.numero) - Number(b.numero);
    });

    var selected;
    if (String(entrada.modalidad) === 'Presencial') {
      selected = cartones.slice(-cantidad).reverse();
    } else {
      selected = cartones.slice(0, cantidad);
    }

    var comprador = entrada.nombre + ' ' + entrada.apellido;
    selected.forEach(function(c) {
      updateRowFields(sheet, c.row, {
        estado: 'Asignado',
        entradaID: entrada.entradaID,
        comprador: comprador,
        vendedor: entrada.vendedor
      });
    });

    return selected.map(function(c) { return c.numero; });
  } finally {
    lock.releaseLock();
  }
}

function releaseCartones(entradaId) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet(SHEET_NAMES.CARTONES);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var entradaCol = headers.indexOf('entradaID');
    var numCol = headers.indexOf('numero');

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][entradaCol]) !== String(entradaId)) continue;
      updateRowFields(sheet, i + 1, {
        estado: 'Disponible',
        entradaID: '',
        comprador: '',
        vendedor: ''
      });
    }
  } finally {
    lock.releaseLock();
  }
}

function getCartonesForEntrada(entradaId) {
  var nums = [];
  var cartones = getCartonesSheetData();
  cartones.forEach(function(c) {
    if (String(c.entradaID) === String(entradaId)) {
      nums.push({
        numero: padCardNumber(c.numero),
        linkJuego: c.linkJuego,
        linkPDF: c.linkPDF
      });
    }
  });
  nums.sort(function(a, b) { return Number(a.numero) - Number(b.numero); });
  return nums;
}
