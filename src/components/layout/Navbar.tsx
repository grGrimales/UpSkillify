import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { Language } from "@prisma/client";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Language) || Language.ES;

  const translations = {
    ES: {
      admin: "Panel Admin",
      login: "Iniciar Sesión",
    },
    EN: {
      admin: "Admin Panel",
      login: "Login",
    },
  };

  const t = translations[lang] || translations.ES;

  return (
    <NavbarClient 
      session={session} 
      adminText={t.admin} 
      loginText={t.login} 
    />
  );
}
