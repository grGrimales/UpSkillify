"use client";

import { useState } from "react";
import { Language } from "@prisma/client";
import { getTopicsContent } from "@/lib/actions/topic";
import { useToast } from "@/context/ToastContext";

interface TopicExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
  topics: { id: string; title: string; order: number }[];
  currentLang: Language;
}

export default function TopicExportModal({
  isOpen,
  onClose,
  moduleTitle,
  topics,
  currentLang,
}: TopicExportModalProps) {
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
    topics.map((t) => t.id)
  );
  const [exportLang, setExportLang] = useState<Language>(currentLang);
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedTopicIds.length === topics.length) {
      setSelectedTopicIds([]);
    } else {
      setSelectedTopicIds(topics.map((t) => t.id));
    }
  };

  const handleExport = async () => {
    if (selectedTopicIds.length === 0) {
      showToast(
        currentLang === "ES"
          ? "Selecciona al menos un tema para exportar"
          : "Select at least one topic to export",
        "error"
      );
      return;
    }

    setIsExporting(true);
    try {
      const content = await getTopicsContent(selectedTopicIds, exportLang);

      const markdown = content
        .map((topic) => `---\ntitle: ${topic.title}\n---\n\n${topic.content}`)
        .join("\n\n\n");

      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${moduleTitle.replace(/\s+/g, "_")}_${exportLang}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(
        currentLang === "ES" ? "Exportación completada" : "Export completed",
        "success"
      );
      onClose();
    } catch (_error) {
      showToast(
        currentLang === "ES" ? "Error al exportar" : "Export failed",
        "error"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">
              {currentLang === "ES" ? "Exportar Temas" : "Export Topics"}
            </h2>
            <p className="text-sm text-zinc-500">{moduleTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Language Selection */}
          <div>
            <label className="text-sm font-bold block mb-3">
              {currentLang === "ES"
                ? "Idioma de exportación"
                : "Export Language"}
            </label>
            <div className="flex gap-3">
              {[
                { id: Language.ES, label: "Español" },
                { id: Language.EN, label: "English" },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setExportLang(lang.id)}
                  className={`flex-1 py-2 px-4 rounded-xl border-2 font-bold transition-all ${
                    exportLang === lang.id
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                      : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selection */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-bold">
                {currentLang === "ES"
                  ? "Seleccionar temas"
                  : "Select topics"}
              </label>
              <button
                onClick={toggleAll}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                {selectedTopicIds.length === topics.length
                  ? currentLang === "ES"
                    ? "Deseleccionar todos"
                    : "Deselect all"
                  : currentLang === "ES"
                    ? "Seleccionar todos"
                    : "Select all"}
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedTopicIds.includes(topic.id)
                      ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                      : "border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-400">
                      {topic.order}.
                    </span>
                    <span className="text-sm font-medium">{topic.title}</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      selectedTopicIds.includes(topic.id)
                        ? "bg-blue-600 border-blue-600"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    {selectedTopicIds.includes(topic.id) && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {currentLang === "ES" ? "Cancelar" : "Cancel"}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedTopicIds.length === 0}
            className="flex-1 py-3 px-4 rounded-xl font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-black/10"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {currentLang === "ES" ? "Exportando..." : "Exporting..."}
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
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
                {currentLang === "ES" ? "Descargar .md" : "Download .md"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
