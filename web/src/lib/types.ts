export interface Permissions {
  bingoAdmin_precios: boolean;
  bingoAdmin_equipo: boolean;
  bingoAdmin_cartones: boolean;
  bingoAdmin_notificaciones: boolean;
  bingoVentas_pendientes: boolean;
  bingoVentas_notificaciones: boolean;
  bingoVentas_myfreebingo: boolean;
  bingoVentas_historial: boolean;
  admin_usuarios: boolean;
  admin_permisos: boolean;
}

export interface User {
  userID: number;
  nombre: string;
  apellido: string;
  user: string;
  email: string;
  admin: boolean;
}

export interface Entrada {
  entradaID: number;
  fechaRegistro: string;
  nombre: string;
  apellido: string;
  modalidad: string;
  correo: string;
  notifyWhatsApp: boolean;
  numWA: string;
  cantidad: number;
  monto: number;
  vendedor: string;
  metodo: string;
  comprobante: string;
  estado: string;
  cartonesAsignados: string;
  emailEnviado: boolean;
  whatsappEnviado: boolean;
  myfreebingoListo: boolean;
  notaRegreso: string;
  fechaCompletada: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FormConfig {
  precios: Record<string, number>;
  equipo: { id: number; nombre: string }[];
  sinpe: { numero: string; nombre: string };
  iban: string;
}

export interface PermissionLabel {
  key: keyof Permissions;
  label: string;
  group: string;
}

export const DEFAULT_PERMISSIONS: Permissions = {
  bingoAdmin_precios: false,
  bingoAdmin_equipo: false,
  bingoAdmin_cartones: false,
  bingoAdmin_notificaciones: false,
  bingoVentas_pendientes: false,
  bingoVentas_notificaciones: false,
  bingoVentas_myfreebingo: false,
  bingoVentas_historial: false,
  admin_usuarios: false,
  admin_permisos: false,
};

export const ALL_PERMISSIONS: Permissions = {
  bingoAdmin_precios: true,
  bingoAdmin_equipo: true,
  bingoAdmin_cartones: true,
  bingoAdmin_notificaciones: true,
  bingoVentas_pendientes: true,
  bingoVentas_notificaciones: true,
  bingoVentas_myfreebingo: true,
  bingoVentas_historial: true,
  admin_usuarios: true,
  admin_permisos: true,
};
