import type { Metadata } from "next";
import { SignInPage } from "@/features/Auth/frontend/pages/SignInPage";
import { auth } from "@/core/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description:
    "Accede a tu cuenta de PeopleFlow ERP para gestionar tu organización.",
};

export default async function Page() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (session?.user) {
    redirect("/");
  }

  const cloudflareSiteKey = process.env.CLOUDFLARE_SITE_KEY ?? "";

  return <SignInPage cloudflareSiteKey={cloudflareSiteKey} />;
}
