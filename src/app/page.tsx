import prisma from "../core/lib/prisma";
import { AuthExample } from "./components/auth-example";

export default async function Page() {
  return <AuthExample />;
}
