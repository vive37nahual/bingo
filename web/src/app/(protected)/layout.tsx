import { AuthGuard } from "@/components/auth/AuthGuard";
import { Header } from "@/components/layout/Header";
import { UnsavedChangesProvider } from "@/components/ui/UnsavedChanges";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <UnsavedChangesProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </div>
      </UnsavedChangesProvider>
    </AuthGuard>
  );
}
