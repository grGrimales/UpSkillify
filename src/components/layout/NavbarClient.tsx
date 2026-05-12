"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import LogoutButton from "../auth/LogoutButton";
import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSelector from "./LanguageSelector";

interface NavbarClientProps {
  session: Session | null;
  adminText: string;
  loginText: string;
}

export default function NavbarClient({ session, adminText, loginText }: NavbarClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo and Desktop Nav */}
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold tracking-tight">
                UpSkillify<span className="text-blue-600">.</span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                {session?.user?.role === "ADMIN" && (
                  <Link
                    href="/admin/courses"
                    className={`text-sm font-medium transition-colors ${
                      pathname.startsWith("/admin")
                        ? "text-black dark:text-white"
                        : "text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
                    }`}
                  >
                    {adminText}
                  </Link>
                )}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeSwitcher />
              <LanguageSelector />
              
              {session ? (
                <div className="flex items-center gap-4 border-l border-zinc-200 dark:border-zinc-800 pl-4">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {session.user?.name}
                  </span>
                  <LogoutButton />
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="text-sm font-bold px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg transition-transform active:scale-95"
                >
                  {loginText}
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeSwitcher />
              <button
                onClick={toggleMenu}
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-6 space-y-4 animate-in slide-in-from-top duration-200">
            <div className="flex flex-col gap-4">
              {session?.user?.role === "ADMIN" && (
                <Link
                  href="/admin/courses"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-zinc-600 dark:text-zinc-400"
                >
                  {adminText}
                </Link>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <span className="text-sm text-zinc-500">Language</span>
                <LanguageSelector />
              </div>

              {session ? (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Account</span>
                    <span className="text-sm font-medium">{session.user?.name}</span>
                  </div>
                  <LogoutButton />
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold"
                >
                  {loginText}
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
