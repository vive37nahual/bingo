"use client";

import { useState } from "react";
import useSWR from "swr";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";
import type { Permissions } from "@/lib/types";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Modal } from "@/components/ui/Modal";
import { PermissionsChecklist } from "@/components/auth/PermissionsChecklist";

interface UserRow {
  userID: number;
  nombre: string;
  apellido: string;
  user: string;
  email: string;
  permissions: Permissions;
  hasPassword: boolean;
}

export default function PermisosPage() {
  const { token } = useAuth();
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editPermissions, setEditPermissions] = useState<Permissions | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showReset, setShowReset] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(["allUsers", token], () =>
    apiCall<UserRow[]>("getAllUsers", {}, token)
  );

  const openEdit = (user: UserRow) => {
    setEditUser(user);
    setEditPermissions(user.permissions);
    setResetPassword("");
  };

  const savePermissions = async () => {
    if (!editUser || !editPermissions) return;
    setSaving(true);
    try {
      await apiCall(
        "updateUserPermissions",
        { userId: editUser.userID, permissions: editPermissions },
        token
      );
      if (resetPassword) {
        await apiCall(
          "resetUserPassword",
          { userId: editUser.userID, newPassword: resetPassword },
          token
        );
      }
      setEditUser(null);
      await mutate();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Console — Permisos</h1>
        <RefreshButton onRefresh={() => mutate()} loading={isLoading} />
      </div>

      <SectionLoader loading={isLoading}>
        {error && (
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Error"}
          </p>
        )}
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Email</th>
                <th className="p-3">Contraseña</th>
                <th className="p-3">Permisos</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((user) => (
                <tr key={user.userID} className="border-b">
                  <td className="p-3">
                    {user.nombre} {user.apellido}
                  </td>
                  <td className="p-3">{user.user}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {showReset === user.userID ? "(restablecer en editar)" : "••••••••"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setShowReset(showReset === user.userID ? null : user.userID)
                        }
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {showReset === user.userID ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => openEdit(user)}
                      className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionLoader>

      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title={`Permisos — ${editUser?.nombre} ${editUser?.apellido}`}
        wide
      >
        {editPermissions && (
          <>
            <PermissionsChecklist
              permissions={editPermissions}
              onChange={setEditPermissions}
            />
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium">
                Restablecer contraseña (opcional)
              </label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Nueva contraseña"
              />
            </div>
            <button
              type="button"
              onClick={savePermissions}
              disabled={saving}
              className="mt-4 rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}
