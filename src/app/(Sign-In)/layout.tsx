import { FloatingPaths } from "@/features/Auth/frontend/components/floating-paths";
import Image from "next/image";

export default function SignInLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-10">
        {/* Logo en la parte superior del panel izquierdo */}
        <div className="flex justify-center lg:justify-start mb-4">
          <div className="relative w-48 h-16 sm:w-48 sm:h-16">
            <Image
              src="/logos/logo-principal.webp"
              alt="PeopleFlow Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Contenido del formulario centrado */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm mx-auto px-2 sm:px-0">{children}</div>
        </div>
      </div>

      {/* Panel derecho solo con la animación */}
      <div className="relative hidden lg:block md:border md:border-l bg-muted/30">
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>
    </div>
  );
}
