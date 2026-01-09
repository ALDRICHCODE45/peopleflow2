import Image from "next/image";

/**
 * Layout para páginas de autenticación (select-tenant)
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative w-48 h-16">
            <Image
              src="/logos/logo-principal.webp"
              alt="PeopleFlow Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
