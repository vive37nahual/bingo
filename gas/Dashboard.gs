function getDashboardData(token, filters) {
  requireAuth(token);
  filters = filters || {};

  var entradas = sheetToObjects(getSheet(SHEET_NAMES.ENTRADAS));
  var cartonesByEntrada = buildCartonesByEntradaId_();
  var includeNonApproved = filters.includeNonApproved === true;

  var filtered = entradas.filter(function(e) {
    if (!includeNonApproved && String(e.estado) !== 'Completada') return false;
    if (includeNonApproved && String(e.estado) === 'Rechazada') return false;
    if (includeNonApproved && String(e.estado) === 'Pendiente') return false;
    if (!includeNonApproved && String(e.estado) !== 'Completada') return false;

    if (filters.vendedor && String(e.vendedor) !== String(filters.vendedor)) return false;
    if (filters.cantidadMin && Number(e.cantidad) < Number(filters.cantidadMin)) return false;
    if (filters.cantidadMax && Number(e.cantidad) > Number(filters.cantidadMax)) return false;
    if (filters.montoMin && Number(e.monto) < Number(filters.montoMin)) return false;
    if (filters.montoMax && Number(e.monto) > Number(filters.montoMax)) return false;
    return true;
  });

  if (includeNonApproved) {
    filtered = entradas.filter(function(e) {
      if (String(e.estado) === 'Rechazada' || String(e.estado) === 'Pendiente') return false;
      if (filters.vendedor && String(e.vendedor) !== String(filters.vendedor)) return false;
      if (filters.cantidadMin && Number(e.cantidad) < Number(filters.cantidadMin)) return false;
      if (filters.cantidadMax && Number(e.cantidad) > Number(filters.cantidadMax)) return false;
      if (filters.montoMin && Number(e.monto) < Number(filters.montoMin)) return false;
      if (filters.montoMax && Number(e.monto) > Number(filters.montoMax)) return false;
      return String(e.estado) === 'Completada' || String(e.estado) === 'Aprobada';
    });
  }

  var ventasAprobadas = filtered.length;
  var cartonesVendidos = filtered.reduce(function(sum, e) { return sum + Number(e.cantidad); }, 0);
  var montoRecaudado = filtered.reduce(function(sum, e) { return sum + Number(e.monto); }, 0);

  var porVendedorCantidad = {};
  var porVendedorMonto = {};
  filtered.forEach(function(e) {
    var v = e.vendedor || 'Sin vendedor';
    porVendedorCantidad[v] = (porVendedorCantidad[v] || 0) + Number(e.cantidad);
    porVendedorMonto[v] = (porVendedorMonto[v] || 0) + Number(e.monto);
  });

  var tabla = filtered.map(function(e) {
    return {
      comprador: e.nombre + ' ' + e.apellido,
      modalidad: e.modalidad,
      cantidad: Number(e.cantidad),
      cartones: resolveCartonesForEntrada_(e, cartonesByEntrada),
      precioPagado: Number(e.monto),
      vendedor: e.vendedor
    };
  });

  var vendedores = getEquipoActivo().map(function(e) { return e.nombre; });

  return {
    kpis: {
      ventasAprobadas: ventasAprobadas,
      cartonesVendidos: cartonesVendidos,
      montoRecaudado: montoRecaudado
    },
    charts: {
      cantidadPorVendedor: objectToChartData(porVendedorCantidad),
      montoPorVendedor: objectToChartData(porVendedorMonto)
    },
    tabla: tabla,
    vendedores: vendedores
  };
}

function objectToChartData(obj) {
  return Object.keys(obj).map(function(key) {
    return { name: key, value: obj[key] };
  });
}

function buildCartonesByEntradaId_() {
  var map = {};
  getCartonesSheetData().forEach(function(c) {
    if (!c.entradaID) return;
    var id = String(c.entradaID);
    if (!map[id]) map[id] = [];
    map[id].push(padCardNumber(c.numero));
  });
  Object.keys(map).forEach(function(id) {
    map[id].sort(function(a, b) { return Number(a) - Number(b); });
    map[id] = map[id].join(', ');
  });
  return map;
}

function resolveCartonesForEntrada_(entrada, cartonesByEntrada) {
  var fromField = String(entrada.cartonesAsignados || '').trim();
  if (fromField) {
    return fromField.split(',').map(function(n) {
      return padCardNumber(n.trim());
    }).filter(function(n) { return n; }).join(', ');
  }
  return cartonesByEntrada[String(entrada.entradaID)] || '';
}

function exportDashboardCSV(token, filters) {
  var data = getDashboardData(token, filters);
  var lines = ['Comprador,Modalidad,Cantidad,Cartones,Precio Pagado,Vendedor'];
  data.tabla.forEach(function(row) {
    lines.push([
      '"' + row.comprador + '"',
      row.modalidad,
      row.cantidad,
      '"' + (row.cartones || '') + '"',
      row.precioPagado,
      '"' + row.vendedor + '"'
    ].join(','));
  });
  return { csv: lines.join('\n') };
}

function getPresenciales(token) {
  requireAuth(token);
  var cartonesByEntrada = buildCartonesByEntradaId_();
  return sheetToObjects(getSheet(SHEET_NAMES.ENTRADAS))
    .filter(function(e) {
      return String(e.modalidad) === 'Presencial' && String(e.estado) === 'Completada';
    })
    .map(function(e) {
      return {
        comprador: e.nombre + ' ' + e.apellido,
        cantidad: Number(e.cantidad),
        cartones: resolveCartonesForEntrada_(e, cartonesByEntrada)
      };
    });
}

function exportHistorialCSV(token) {
  requirePermission(token, 'bingoVentas_historial');
  var items = getEntradasByEstado('Completada');
  var lines = ['Fecha,Codigo Compra,Comprador,Email,Monto,Cantidad,WhatsApp'];
  items.forEach(function(e) {
    lines.push([
      e.fechaCompletada || e.fechaRegistro,
      e.codigoCompra || e.entradaID,
      '"' + e.nombre + ' ' + e.apellido + '"',
      e.correo,
      e.monto,
      e.cantidad,
      e.notifyWhatsApp ? 'Si' : 'No'
    ].join(','));
  });
  return { csv: lines.join('\n') };
}
