"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "./Modal";

interface UnsavedChangesContextValue {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  attemptNavigate: (href: string) => void;
  markSaved: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(
  null
);

export function UnsavedChangesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const attemptNavigate = useCallback(
    (href: string) => {
      if (isDirty) {
        setPendingHref(href);
        setShowModal(true);
      } else {
        router.push(href);
      }
    },
    [isDirty, router]
  );

  const confirmLeave = useCallback(() => {
    setIsDirty(false);
    setShowModal(false);
    if (pendingHref) {
      router.push(pendingHref);
      setPendingHref(null);
    }
  }, [pendingHref, router]);

  const markSaved = useCallback(() => setIsDirty(false), []);

  return (
    <UnsavedChangesContext.Provider
      value={{
        isDirty,
        setDirty: setIsDirty,
        attemptNavigate,
        markSaved,
      }}
    >
      {children}
      <ConfirmModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setPendingHref(null);
        }}
        onConfirm={confirmLeave}
        message="Estás intentando salir de este sitio sin guardar los cambios. ¿Deseas salir sin guardar los cambios?"
      />
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChangesContext() {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) {
    throw new Error(
      "useUnsavedChangesContext must be used within UnsavedChangesProvider"
    );
  }
  return ctx;
}

/** Call from pages with form state — marks dirty when `dirty` is true */
export function useUnsavedChanges(dirty: boolean) {
  const { setDirty } = useUnsavedChangesContext();
  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);
}
