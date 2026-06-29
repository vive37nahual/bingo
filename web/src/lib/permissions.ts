import type { Permissions } from "./types";

export function hasPermission(
  permissions: Permissions | null,
  key: keyof Permissions,
  isAdmin?: boolean
): boolean {
  if (isAdmin) return true;
  if (!permissions) return false;
  return !!permissions[key];
}

export function canAccessRoute(
  pathname: string,
  permissions: Permissions | null,
  isAdmin?: boolean
): boolean {
  if (isAdmin) return true;
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/bingo-admin/precios"))
    return hasPermission(permissions, "bingoAdmin_precios");
  if (pathname.startsWith("/bingo-admin/equipo"))
    return hasPermission(permissions, "bingoAdmin_equipo");
  if (pathname.startsWith("/bingo-admin/cartones"))
    return hasPermission(permissions, "bingoAdmin_cartones");
  if (pathname.startsWith("/bingo-admin/notificaciones"))
    return hasPermission(permissions, "bingoAdmin_notificaciones");
  if (pathname.startsWith("/bingo-ventas/pendientes"))
    return hasPermission(permissions, "bingoVentas_pendientes");
  if (pathname.startsWith("/bingo-ventas/notificaciones"))
    return hasPermission(permissions, "bingoVentas_notificaciones");
  if (pathname.startsWith("/bingo-ventas/myfreebingocards"))
    return hasPermission(permissions, "bingoVentas_myfreebingo");
  if (pathname.startsWith("/bingo-ventas/historial"))
    return hasPermission(permissions, "bingoVentas_historial");
  if (pathname.startsWith("/admin/usuarios"))
    return hasPermission(permissions, "admin_usuarios");
  if (pathname.startsWith("/admin/permisos"))
    return hasPermission(permissions, "admin_permisos");
  return false;
}

export const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard/bingo",
    children: [
      { label: "BINGO", href: "/dashboard/bingo" },
      { label: "Presenciales", href: "/dashboard/presenciales" },
    ],
  },
  {
    label: "BINGO Admin",
    permissionPrefix: "bingoAdmin",
    children: [
      {
        label: "Precios",
        href: "/bingo-admin/precios",
        permission: "bingoAdmin_precios" as const,
      },
      {
        label: "Equipo",
        href: "/bingo-admin/equipo",
        permission: "bingoAdmin_equipo" as const,
      },
      {
        label: "Cartones",
        href: "/bingo-admin/cartones",
        permission: "bingoAdmin_cartones" as const,
      },
      {
        label: "Notificaciones",
        href: "/bingo-admin/notificaciones",
        permission: "bingoAdmin_notificaciones" as const,
      },
    ],
  },
  {
    label: "BINGO Ventas",
    permissionPrefix: "bingoVentas",
    children: [
      {
        label: "Pendientes",
        href: "/bingo-ventas/pendientes",
        permission: "bingoVentas_pendientes" as const,
      },
      {
        label: "Notificaciones",
        href: "/bingo-ventas/notificaciones",
        permission: "bingoVentas_notificaciones" as const,
      },
      {
        label: "MyFreeBingoCards",
        href: "/bingo-ventas/myfreebingocards",
        permission: "bingoVentas_myfreebingo" as const,
      },
      {
        label: "Historial",
        href: "/bingo-ventas/historial",
        permission: "bingoVentas_historial" as const,
      },
    ],
  },
  {
    label: "Admin Console",
    permissionPrefix: "admin",
    children: [
      {
        label: "Usuarios",
        href: "/admin/usuarios",
        permission: "admin_usuarios" as const,
      },
      {
        label: "Permisos",
        href: "/admin/permisos",
        permission: "admin_permisos" as const,
      },
    ],
  },
];
