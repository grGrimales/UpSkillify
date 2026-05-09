import Link from "next/link";
import LanguageSelector from "./LanguageSelector";
import ThemeSwitcher from "./ThemeSwitcher";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LogoutButton from "../auth/LogoutButton";

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold tracking-tight">
              UpSkillify<span className="text-blue-600">.</span>
            </Link>

            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin/courses"
                className="text-sm font-medium text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <LanguageSelector />
            
            {session ? (
              <div className="flex items-center gap-4 border-l border-zinc-200 dark:border-zinc-800 pl-4">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hidden sm:inline">
                  {session.user?.name}
                </span>
                <LogoutButton />
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm font-bold px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
