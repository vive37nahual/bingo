"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { NAV_ITEMS } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";
import type { Permissions } from "@/lib/types";
import { useUnsavedChangesContext } from "@/components/ui/UnsavedChanges";

function sectionPathPrefix(label: string): string {
  switch (label) {
    case "Dashboard":
      return "/dashboard";
    case "BINGO Admin":
      return "/bingo-admin";
    case "BINGO Ventas":
      return "/bingo-ventas";
    case "Admin Console":
      return "/admin";
    default:
      return "";
  }
}

export function Header() {
  const { user, permissions, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const { attemptNavigate } = useUnsavedChangesContext();

  const visibleNav = useMemo(
    () =>
      NAV_ITEMS.map((section) => {
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
      }).filter(Boolean),
    [permissions, isAdmin]
  );

  const activeSection = useMemo(() => {
    const match = visibleNav.find((section) => {
      const prefix = sectionPathPrefix(section!.label);
      return prefix && pathname.startsWith(prefix);
    });
    return match ?? visibleNav[0];
  }, [visibleNav, pathname]);

  const isActive = (href: string) => pathname === href;

  const handleNav = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    attemptNavigate(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0" onClick={(e) => handleNav(e, "/")}>
          <Image
            src="/logo-ref.png"
            alt="VIVE 37 Nahual"
            width={200}
            height={200}
            className="h-[72px] w-auto object-contain md:h-[88px]"
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

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {user && (
            <span className="hidden text-sm text-gray-700 md:inline">
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

      {/* Fila 1: pestañas principales */}
      <nav className="border-t border-amber-200/80 bg-white/60">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2">
          {visibleNav.map((section) => {
            const prefix = sectionPathPrefix(section!.label);
            const isSectionActive = pathname.startsWith(prefix);
            const firstChild = section!.children?.[0]?.href ?? "/dashboard/bingo";
            return (
              <button
                key={section!.label}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (!isSectionActive) attemptNavigate(firstChild);
                }}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  isSectionActive
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-white text-gray-700 hover:bg-amber-100"
                }`}
              >
                {section!.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Fila 2: subsecciones de la pestaña activa */}
      {activeSection?.children && (
        <nav className="border-t border-amber-100 bg-amber-50/50">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2">
            {activeSection.children.map((child) => (
              <a
                key={child.href}
                href={child.href}
                onClick={(e) => handleNav(e, child.href)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  isActive(child.href)
                    ? "bg-amber-700 text-white"
                    : "text-amber-900 hover:bg-amber-200/60"
                }`}
              >
                {child.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
