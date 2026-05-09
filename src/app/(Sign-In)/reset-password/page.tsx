import type { Metadata } from "next";
import { ResetPasswordPage } from "@/features/Auth/frontend/pages/ResetPasswordPage";
import { auth } from "@/core/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Restablecer contraseña",
  description:
    "Establece una nueva contraseña para tu cuenta de PeopleFlow ERP.",
};

export default async function Page() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  // If user is already logged in, redirect to home
  if (session?.user) {
    redirect("/");
  }

  return <ResetPasswordPage />;
}
