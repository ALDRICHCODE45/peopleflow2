import type { Metadata } from "next";
import { SignInPage } from "@/features/Auth/frontend/pages/SignInPage";

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description:
    "Accede a tu cuenta de PeopleFlow ERP para gestionar tu organización.",
};

const Page = () => {
  return (
    <>
      <SignInPage />
    </>
  );
};

export default Page;
