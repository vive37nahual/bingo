"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { NAV_ITEMS } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";
import type { Permissions } from "@/lib/types";
export function Header() {
  const { user, permissions, isAdmin, logout } = useAuth();
  const pathname = usePathname();

  const visibleNav = NAV_ITEMS.map((section) => {
    if (section.label === "Dashboard") return section;
    const children = section.children?.filter((child) => {
      if (!("permission" in child)) return true;
      return hasPermission(
        permissions,
        child.permission as keyof Permissions,
        isAdmin
      );
    });
    if (!children?.length) return null;
    return { ...section, children };
  }).filter(Boolean);

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-40 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.png"
            alt="VIVE 37 Nahual"
            width={200}
            height={200}
            className="h-[80px] w-auto object-contain md:h-[100px]"
            priority
          />
        </Link>

        <a
          href="/formulario"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Formulario
        </a>

        <nav className="hidden flex-1 flex-col gap-1 lg:flex">
          {visibleNav.map((section) => (
            <div key={section!.label} className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-amber-800">
                {section!.label}
              </span>
              <div className="flex flex-wrap gap-1">
                {section!.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`rounded px-2 py-1 text-sm ${
                      isActive(child.href)
                        ? "bg-amber-600 text-white"
                        : "text-gray-700 hover:bg-amber-100"
                    }`}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {user && (
            <span className="hidden text-sm text-gray-700 sm:inline">
              {user.nombre} {user.apellido}
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="border-t border-amber-200 px-4 py-2 lg:hidden">
        <div className="flex flex-wrap gap-2">
          {visibleNav.flatMap((section) =>
            section!.children?.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={`rounded px-2 py-1 text-xs ${
                  isActive(child.href)
                    ? "bg-amber-600 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                {child.label}
              </Link>
            )) ?? []
          )}
        </div>
      </nav>
    </header>
  );
}
