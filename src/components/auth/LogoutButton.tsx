"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="px-8 py-3 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-full font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
    >
      Logout
    </button>
  );
}
