import type { Metadata } from "next";
import { ForgotPasswordPage } from "@/features/Auth/frontend/pages/ForgotPasswordPage";
import { auth } from "@/core/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Olvidé mi contraseña",
  description:
    "Restablece tu contraseña de PeopleFlow ERP para recuperar el acceso a tu cuenta.",
};

export default async function Page() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  // If user is already logged in, redirect to home
  if (session?.user) {
    redirect("/");
  }

  return <ForgotPasswordPage />;
}
