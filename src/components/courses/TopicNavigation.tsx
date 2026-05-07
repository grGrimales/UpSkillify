"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TopicNavigationProps {
  prevTopicId: string | null;
  nextTopicId: string | null;
  isCompleted: boolean;
  courseSlug: string;
  lang: string;
}

export default function TopicNavigation({ 
  prevTopicId, 
  nextTopicId, 
  isCompleted, 
  courseSlug,
  lang 
}: TopicNavigationProps) {
  return (
    <div className="flex items-center justify-between mt-12 gap-4">
      {prevTopicId ? (
        <Link
          href={`/courses/${courseSlug}/topics/${prevTopicId}`}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {lang === "ES" ? "Anterior" : "Previous"}
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {nextTopicId && (
        <Link
          href={isCompleted ? `/courses/${courseSlug}/topics/${nextTopicId}` : "#"}
          onClick={(e) => {
            if (!isCompleted) {
              e.preventDefault();
            }
          }}
          className={`
            flex-1 flex items-center justify-center gap-2 px-6 py-4 border rounded-2xl font-bold text-sm transition-all shadow-sm
            ${isCompleted 
              ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 text-black dark:text-white" 
              : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800 text-zinc-400 cursor-not-allowed"}
          `}
        >
          {lang === "ES" ? "Siguiente" : "Next"}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {!isCompleted && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {lang === "ES" ? "Completa esta lectura para avanzar" : "Complete this topic to move forward"}
            </div>
          )}
        </Link>
      )}
    </div>
  );
}
