"use client";

import { useState } from "react";
import Link from "next/link";
import { Language } from "@prisma/client";
import TopicExportModal from "@/components/courses/TopicExportModal";

type Topic = {
  id: string;
  order: number;
  title: string;
  userProgress?: { id: string }[];
};

type Exam = {
  id: string;
  title: string;
};

type ModuleData = {
  id: string;
  order: number;
  title: string;
  description?: string | null;
  topics: Topic[];
  exams: Exam[];
};

export default function ModuleAccordion({
  module,
  slug,
  lang,
  isLoggedIn,
  isEnrolled,
  defaultOpen = false,
}: {
  module: ModuleData;
  slug: string;
  lang: string;
  isLoggedIn: boolean;
  isEnrolled: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const completedCount = module.topics.filter(
    (t) => t.userProgress && t.userProgress.length > 0
  ).length;
  const moduleProgress =
    module.topics.length > 0
      ? Math.round((completedCount / module.topics.length) * 100)
      : 0;

  const itemCount = [
    module.topics.length > 0
      ? `${module.topics.length} ${lang === "ES" ? "temas" : "topics"}`
      : null,
    module.exams.length > 0
      ? `${module.exams.length} ${lang === "ES" ? "exámenes" : "exams"}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-stretch">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex-1 p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isOpen ? "border-b border-zinc-100 dark:border-zinc-800" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold">
                {module.order}. {module.title}
              </h3>
              {module.description && (
                <p className="text-zinc-500 text-sm mt-1">{module.description}</p>
              )}
              {!isOpen && itemCount && (
                <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1.5 font-medium">
                  {itemCount}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {isLoggedIn && isEnrolled && module.topics.length > 0 && (
                <div className="flex items-center gap-3 min-w-[120px]">
                  <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${moduleProgress === 100 ? "bg-emerald-500" : "bg-blue-600"}`}
                      style={{ width: `${moduleProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold tabular-nums w-8 text-right">
                    {moduleProgress}%
                  </span>
                </div>
              )}

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-zinc-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </button>

          {module.topics.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExportModalOpen(true);
              }}
              title={lang === "ES" ? "Exportar temas" : "Export topics"}
              className="px-4 border-l border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
            >
              <svg
                className="w-5 h-5 text-zinc-400 group-hover:text-blue-600 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
          )}
        </div>

        {isOpen && (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {module.topics.map((topic) => {
              const isCompleted =
                topic.userProgress && topic.userProgress.length > 0;
              return (
                <div
                  key={topic.id}
                  className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                      }`}
                    >
                      {isCompleted ? "✓" : topic.order}
                    </div>
                    <span
                      className={`font-medium ${isCompleted ? "text-zinc-400 line-through" : ""}`}
                    >
                      {topic.title}
                    </span>
                  </div>
                  <Link
                    href={`/courses/${slug}/topics/${topic.id}`}
                    className="text-sm px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 transition-colors"
                  >
                    {isCompleted
                      ? lang === "ES"
                        ? "Repasar"
                        : "Review"
                      : lang === "ES"
                        ? "Empezar"
                        : "Start"}
                  </Link>
                </div>
              );
            })}

            {module.exams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-900/5 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📝</span>
                  <span className="font-medium italic">{exam.title}</span>
                </div>
                <Link
                  href={`/courses/${slug}/exams/${exam.id}`}
                  className="text-sm px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md hover:bg-emerald-200 transition-colors font-bold"
                >
                  {lang === "ES" ? "Tomar Examen" : "Take Exam"}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <TopicExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        moduleTitle={module.title}
        topics={module.topics}
        currentLang={lang as Language}
      />
    </>
  );
}
