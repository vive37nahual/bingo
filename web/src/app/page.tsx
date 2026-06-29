"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 px-4 py-12">
      <Image
        src="/logo.png"
        alt="VIVE 37 Nahual"
        width={280}
        height={280}
        className="mb-8 h-auto w-48 object-contain md:w-64"
        priority
      />

      <div className="mb-6 flex gap-3">
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
              <label className="mb-1 block text-sm font-medium">Usuario o Email</label>
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
              <label className="mb-1 block text-sm font-medium">Contraseña</label>
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
                    setRegisterForm({ ...registerForm, [field]: e.target.value })
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
                    setRegisterForm({ ...registerForm, [field]: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            ))}
            {(["password", "confirmPassword"] as const).map((field) => (
              <div key={field}>
                <label className="mb-1 block text-sm font-medium">
                  {field === "password" ? "Contraseña" : "Confirmar Contraseña"}
                </label>
                <div className="relative">
                  <input
                    required
                    type={
                      (field === "password" ? showPassword : showConfirmPassword)
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
                    {(field === "password" ? showPassword : showConfirmPassword) ? (
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
    </div>
  );
}
