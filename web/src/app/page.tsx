"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogOut, Pencil, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Modal } from "@/components/ui/Modal";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading, login, register, logout, updateUsername } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameMsg, setUsernameMsg] = useState("");

  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    nombre: "",
    apellido: "",
    user: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(loginForm.login, loginForm.password);
      router.push("/dashboard/bingo");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión";
      if (msg.includes("GAS_WEB_APP_URL")) {
        setError(
          "El servidor no está conectado al backend de Google. Verifica GAS_WEB_APP_URL en Vercel."
        );
      } else if (msg.includes("no aprobado") || msg.includes("pendiente")) {
        setError(
          "Tu cuenta está pendiente de aprobación por un administrador."
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (registerForm.email !== registerForm.confirmEmail) {
      setError("Los correos no coinciden");
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      setError("Correo electrónico inválido");
      return;
    }
    setLoading(true);
    try {
      await register(registerForm);
      setSuccess(
        "Solicitud enviada. Un administrador revisará tu cuenta pronto."
      );
      setMode("login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    setUsernameMsg("");
    setLoading(true);
    try {
      await updateUsername(newUsername.trim());
      setUsernameMsg("Nombre de usuario actualizado correctamente");
      setTimeout(() => setShowUsernameModal(false), 1200);
    } catch (err) {
      setUsernameMsg(
        err instanceof Error ? err.message : "Error al actualizar usuario"
      );
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 px-4 py-12">
      <Image
        src="/logo-ref.png"
        alt="VIVE 37 Nahual"
        width={320}
        height={320}
        className="mb-8 h-auto w-56 object-contain md:w-72"
        priority
      />

      <div className="mb-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/formulario"
          className="rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-amber-700"
        >
          Formulario de Venta
        </Link>
        {user && (
          <Link
            href="/dashboard/bingo"
            className="rounded-xl border-2 border-amber-600 bg-white px-6 py-3 font-semibold text-amber-700 shadow-lg hover:bg-amber-50"
          >
            Dashboard
          </Link>
        )}
      </div>

      {user ? (
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {user.nombre} {user.apellido}
              </h2>
              <p className="text-sm text-gray-500">Sesión iniciada</p>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Nombre</dt>
              <dd className="font-medium text-gray-900">
                {user.nombre} {user.apellido}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Correo</dt>
              <dd className="font-medium text-gray-900">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Usuario</dt>
              <dd className="font-medium text-gray-900">{user.user}</dd>
            </div>
          </dl>

          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={() => {
                setNewUsername(user.user);
                setUsernameMsg("");
                setShowUsernameModal(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
            >
              <Pencil className="h-4 w-4" />
              Cambiar nombre de usuario
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${
                mode === "login" ? "bg-white shadow" : "text-gray-600"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${
                mode === "register" ? "bg-white shadow" : "text-gray-600"
              }`}
            >
              Registrarse
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Usuario o Email
                </label>
                <input
                  required
                  value={loginForm.login}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, login: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-amber-600 py-2.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              {(["nombre", "apellido", "user"] as const).map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-medium capitalize">
                    {field === "user" ? "Usuario" : field}
                  </label>
                  <input
                    required
                    value={registerForm[field]}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        [field]: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              ))}
              {(["email", "confirmEmail"] as const).map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-medium">
                    {field === "email" ? "Correo" : "Confirmar Correo"}
                  </label>
                  <input
                    required
                    type="email"
                    value={registerForm[field]}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        [field]: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              ))}
              {(["password", "confirmPassword"] as const).map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-medium">
                    {field === "password"
                      ? "Contraseña"
                      : "Confirmar Contraseña"}
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={
                        (field === "password"
                          ? showPassword
                          : showConfirmPassword)
                          ? "text"
                          : "password"
                      }
                      value={registerForm[field]}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          [field]: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        field === "password"
                          ? setShowPassword(!showPassword)
                          : setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {(field === "password"
                        ? showPassword
                        : showConfirmPassword) ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-amber-600 py-2.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Solicitar Registro"}
              </button>
            </form>
          )}
        </div>
      )}

      <Modal
        open={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        title="Cambiar nombre de usuario"
      >
        <p className="mb-3 text-sm text-gray-600">
          Correo asociado: <strong>{user?.email}</strong>
        </p>
        <input
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="Nuevo nombre de usuario"
        />
        {usernameMsg && (
          <p
            className={`mb-3 text-sm ${usernameMsg.includes("correctamente") ? "text-green-700" : "text-red-600"}`}
          >
            {usernameMsg}
          </p>
        )}
        <button
          type="button"
          onClick={handleUpdateUsername}
          disabled={loading || !newUsername.trim()}
          className="w-full rounded-lg bg-amber-600 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cambio"}
        </button>
      </Modal>
    </div>
  );
}
