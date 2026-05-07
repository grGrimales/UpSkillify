"use client";

import { useState } from "react";
import { updateTopicOrder, deleteTopic } from "@/lib/actions/topic";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";

interface TopicListEditorProps {
  courseId: string;
  moduleId: string;
  topics: any[];
}

export default function TopicListEditor({ courseId, moduleId, topics }: TopicListEditorProps) {
  const { showToast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleOrderChange = async (topicId: string, newOrder: number) => {
    setLoadingId(topicId);
    const result = await updateTopicOrder(topicId, newOrder, courseId, moduleId);
    setLoadingId(null);
    if (result.success) showToast("Orden actualizado", "success");
    else showToast("Error al actualizar orden", "error");
  };

  const handleDelete = async (topicId: string) => {
    if (!confirm("¿Eliminar este tema?")) return;
    const result = await deleteTopic(topicId, courseId, moduleId);
    if (result.success) showToast("Tema eliminado", "success");
    else showToast("Error al eliminar", "error");
  };

  return (
    <div className="space-y-4">
      {topics.map((topic) => {
        const titleEs = topic.translations.find((t: any) => t.language === "ES")?.title || "Sin título";
        const titleEn = topic.translations.find((t: any) => t.language === "EN")?.title || "No title";

        return (
          <div key={topic.id} className="flex items-center gap-3 group">
            <input
              type="number"
              defaultValue={topic.order}
              onBlur={(e) => handleOrderChange(topic.id, parseInt(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              className="w-12 h-12 shrink-0 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl font-black text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <Link
              href={`/admin/courses/${courseId}/modules/${moduleId}/topics/${topic.id}`}
              className="flex-1 flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl hover:border-blue-500/50 hover:bg-white dark:hover:bg-zinc-800 transition-all"
            >
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white">{titleEs}</h4>
                <p className="text-xs text-zinc-400">{titleEn}</p>
              </div>
              <svg className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <button
              onClick={() => handleDelete(topic.id)}
              className="p-3 text-zinc-400 hover:text-red-600 transition-colors shrink-0"
              title="Eliminar tema"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        );
      })}
      {topics.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-3xl text-zinc-400">
          No hay temas en este módulo.
        </div>
      )}
    </div>
  );
}
