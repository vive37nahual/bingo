"use client";

import type { Permissions } from "@/lib/types";
import { DEFAULT_PERMISSIONS } from "@/lib/types";

const PERMISSION_GROUPS = [
  {
    title: "1) BINGO Admin",
    items: [
      { key: "bingoAdmin_precios", label: "1.1) Precios" },
      { key: "bingoAdmin_equipo", label: "1.2) Equipo" },
      { key: "bingoAdmin_cartones", label: "1.3) Cartones" },
      { key: "bingoAdmin_notificaciones", label: "1.4) Notificaciones" },
    ],
  },
  {
    title: "2) BINGO Ventas",
    items: [
      { key: "bingoVentas_pendientes", label: "2.1) Pendientes" },
      { key: "bingoVentas_notificaciones", label: "2.2) Notificaciones" },
      { key: "bingoVentas_myfreebingo", label: "2.3) MyFreeBingoCards" },
      { key: "bingoVentas_historial", label: "2.4) Historial" },
    ],
  },
  {
    title: "3) Admin Console",
    items: [
      { key: "admin_usuarios", label: "3.1) Usuarios" },
      { key: "admin_permisos", label: "3.2) Permisos" },
    ],
  },
] as const;

export function PermissionsChecklist({
  permissions,
  onChange,
}: {
  permissions: Permissions;
  onChange: (p: Permissions) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Permisos: (Dashboard siempre incluido para usuarios aprobados)
      </p>
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-2 font-medium text-gray-800">{group.title}</p>
          <div className="space-y-2 pl-2">
            {group.items.map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={permissions[item.key as keyof Permissions]}
                  onChange={(e) =>
                    onChange({
                      ...permissions,
                      [item.key]: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-amber-600"
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function emptyPermissions(): Permissions {
  return { ...DEFAULT_PERMISSIONS };
}
