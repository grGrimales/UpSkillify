"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { bulkCreateTopics } from "@/lib/actions/module";
import { useToast } from "@/context/ToastContext";

const EXAMPLE_JSON = [
  {
    "order": 1,
    "translations": [
      { 
        "language": "ES", 
        "title": "Introducción", 
        "content": "# Hola\nEste es un contenido de prueba en **Markdown**.\n\n```javascript\nconsole.log('¡Hola Mundo!');\n```" 
      },
      { 
        "language": "EN", 
        "title": "Introduction", 
        "content": "# Hello\nThis is a test content in **Markdown**.\n\n```javascript\nconsole.log('Hello World!');\n```" 
      }
    ]
  }
];

export default function TopicBulkEditor({ moduleId, courseId, existingTopics = [] }: { moduleId: string, courseId: string, existingTopics?: any[] }) {
  const [json, setJson] = useState(JSON.stringify(EXAMPLE_JSON, null, 2));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<"ES" | "EN">("ES");
  const { showToast } = useToast();

  // Load existing topics into JSON if provided
  useEffect(() => {
    if (existingTopics.length > 0) {
      const formatted = existingTopics.map(t => ({
        order: t.order,
        translations: t.translations.map((tr: any) => ({
          language: tr.language,
          title: tr.title,
          content: tr.content,
          videoUrl: tr.videoUrl
        }))
      }));
      setJson(JSON.stringify(formatted, null, 2));
    }
  }, [existingTopics]);

  let parsedTopics: any[] = [];
  try {
    parsedTopics = JSON.parse(json);
  } catch (e) {}

  const handleSave = async () => {
    if (!confirm("This will overwrite existing topics for this module. Continue?")) return;
    
    setLoading(true);
    setError("");
    const result = await bulkCreateTopics(moduleId, courseId, json);
    setLoading(false);
    
    if (!result.success) {
      setError(result.error || "Error saving topics");
      showToast(result.error || "Error saving topics", "error");
    } else {
      showToast("Topics saved successfully!", "success");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6 border-t pt-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500">JSON Content Editor</h3>
          <button 
            onClick={() => setJson(JSON.stringify(EXAMPLE_JSON, null, 2))}
            className="text-xs text-blue-600 hover:underline font-bold"
          >
            Reset to template
          </button>
        </div>
        <div className="relative">
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            className="w-full h-[600px] p-6 font-mono text-sm bg-zinc-950 text-emerald-400 rounded-2xl border border-zinc-800 outline-none focus:ring-2 focus:ring-blue-600 shadow-2xl"
            placeholder="Paste your topics JSON here..."
          />
          <div className="absolute top-4 right-4 text-[10px] text-zinc-700 font-bold uppercase pointer-events-none">
            {parsedTopics.length} Topics Detected
          </div>
        </div>
        {error && <p className="text-red-500 text-sm font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800">{error}</p>}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? "Syncing with Database..." : "Save & Sync Topics"}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500">Live Course Preview</h3>
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <button 
              onClick={() => setActivePreviewTab("ES")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activePreviewTab === "ES" ? "bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              Español
            </button>
            <button 
              onClick={() => setActivePreviewTab("EN")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activePreviewTab === "EN" ? "bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              English
            </button>
          </div>
        </div>
        
        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl h-[600px] overflow-y-auto p-4 md:p-8 shadow-inner">
          {Array.isArray(parsedTopics) ? (
            parsedTopics.map((topic, i) => {
              const trans = topic.translations?.find((t: any) => t.language === activePreviewTab);
              return (
                <div key={i} className="mb-12 last:mb-0">
                   <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-[10px] font-black">
                      {topic.order}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">Topic Preview</span>
                  </div>
                  
                  <article className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                    <header className="px-6 py-8 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                      <h1 className="text-2xl font-extrabold m-0 text-zinc-900 dark:text-white">{trans?.title || "Untitled Topic"}</h1>
                    </header>
                    
                    <div className="p-6 prose prose-zinc dark:prose-invert max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || "");
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {trans?.content || "*No content provided*"}
                      </ReactMarkdown>
                    </div>
                  </article>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-2">
              <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-medium">Invalid JSON structure</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
