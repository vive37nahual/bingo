"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";
import type { Permissions } from "@/lib/types";
import { DEFAULT_PERMISSIONS } from "@/lib/types";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { PermissionsChecklist } from "@/components/auth/PermissionsChecklist";

interface PendingUser {
  userID: number;
  nombre: string;
  apellido: string;
  email: string;
  user: string;
  permissions: Permissions;
}

export default function UsuariosPage() {
  const { token } = useAuth();
  const [permissionsMap, setPermissionsMap] = useState<
    Record<number, Permissions>
  >({});
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const { data, error, isLoading, mutate } = useSWR(
    ["pendingUsers", token],
    () => apiCall<PendingUser[]>("getPendingUsers", {}, token)
  );

  const getPermissions = (user: PendingUser) =>
    permissionsMap[user.userID] || user.permissions || { ...DEFAULT_PERMISSIONS };

  const approve = async (user: PendingUser) => {
    setLoadingId(user.userID);
    try {
      await apiCall(
        "approveUser",
        { userId: user.userID, permissions: getPermissions(user) },
        token
      );
      await mutate();
    } finally {
      setLoadingId(null);
    }
  };

  const reject = async (userId: number) => {
    setLoadingId(userId);
    try {
      await apiCall("rejectUser", { userId }, token);
      await mutate();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Console — Usuarios</h1>
        <RefreshButton onRefresh={() => mutate()} loading={isLoading} />
      </div>

      <SectionLoader loading={isLoading}>
        {error && (
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Error"}
          </p>
        )}
        <div className="space-y-6">
          {data?.map((user) => (
            <div
              key={user.userID}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold">
                {user.nombre} {user.apellido}
              </h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">Usuario: {user.user}</p>

              <div className="mt-4">
                <PermissionsChecklist
                  permissions={getPermissions(user)}
                  onChange={(p) =>
                    setPermissionsMap({ ...permissionsMap, [user.userID]: p })
                  }
                />
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => approve(user)}
                  disabled={loadingId === user.userID}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => reject(user.userID)}
                  disabled={loadingId === user.userID}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
          {data?.length === 0 && (
            <p className="text-center text-gray-500">
              No hay solicitudes pendientes
            </p>
          )}
        </div>
      </SectionLoader>
    </div>
  );
}
