"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { saveTopicJson } from "@/lib/actions/topic";
import { useToast } from "@/context/ToastContext";

interface TopicJsonEditorProps {
  topicId: string;
  moduleId: string;
  courseId: string;
  topic: {
    order: number;
    translations: { language: string; title: string; content: string; videoUrl?: string | null }[];
  };
}

export default function TopicJsonEditor({ topicId, moduleId, courseId, topic }: TopicJsonEditorProps) {
  const [json, setJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"ES" | "EN">("ES");
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const formatted = {
      order: topic.order,
      translations: topic.translations.map(t => ({
        language: t.language,
        title: t.title,
        content: t.content,
        videoUrl: t.videoUrl || null
      }))
    };
    setJson(JSON.stringify(formatted, null, 2));
  }, [topic]);

  let parsed: any = null;
  try { parsed = JSON.parse(json); } catch {}

  const handleSave = async () => {
    setLoading(true);
    setError("");
    const result = await saveTopicJson(topicId, json, courseId, moduleId);
    setLoading(false);
    if (result.success) {
      showToast("Tema guardado correctamente", "success");
      router.push(`/admin/courses/${courseId}/modules/${moduleId}`);
    } else {
      const msg = result.error || "Error al guardar";
      setError(msg);
      showToast(msg, "error");
    }
  };

  const previewTranslation = parsed?.translations?.find((t: any) => t.language === activeTab);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Editor */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500">JSON Editor</h3>
          <span className="text-[10px] text-zinc-400 font-mono">
            {parsed ? "✓ JSON válido" : "✗ JSON inválido"}
          </span>
        </div>
        <div className="relative">
          <textarea
            value={json}
            onChange={(e) => { setJson(e.target.value); setError(""); }}
            className="w-full h-[560px] p-6 font-mono text-sm bg-zinc-950 text-emerald-400 rounded-2xl border border-zinc-800 outline-none focus:ring-2 focus:ring-blue-600 shadow-2xl resize-none"
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800">
            {error}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={loading || !parsed}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? "Guardando..." : "Guardar Tema"}
        </button>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500">Vista Previa</h3>
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <button
              onClick={() => setActiveTab("ES")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "ES" ? "bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              Español
            </button>
            <button
              onClick={() => setActiveTab("EN")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "EN" ? "bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              English
            </button>
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl h-[560px] overflow-y-auto shadow-inner">
          {parsed && previewTranslation ? (
            <article className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm m-4">
              <header className="px-6 py-8 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-[10px] font-black">
                    {parsed.order}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">Tema</span>
                </div>
                <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                  {previewTranslation.title || "Sin título"}
                </h1>
                {previewTranslation.videoUrl && (
                  <p className="text-xs text-blue-500 mt-2 font-mono truncate">{previewTranslation.videoUrl}</p>
                )}
              </header>
              <div className="p-6 prose prose-zinc dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>{children}</code>
                      );
                    },
                  }}
                >
                  {previewTranslation.content || "*Sin contenido*"}
                </ReactMarkdown>
              </div>
            </article>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-medium text-sm">JSON inválido</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
