"use client";

import { useState } from "react";
import { generateCourseModules } from "@/lib/actions/gemini";
import { bulkCreateModules } from "@/lib/actions/module";
import { useToast } from "@/context/ToastContext";

interface ModuleBulkGeneratorProps {
  courseId: string;
  nextOrder: number;
}

export default function ModuleBulkGenerator({ courseId, nextOrder }: ModuleBulkGeneratorProps) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedModules, setGeneratedModules] = useState<any[] | null>(null);
  const { showToast } = useToast();

  const handleGenerate = async () => {
    if (!input.trim()) {
      showToast("Por favor, ingresa una lista o descripción de los módulos.", "error");
      return;
    }

    setIsGenerating(true);
    setGeneratedModules(null);

    try {
      const result = await generateCourseModules(input, nextOrder);
      if (result.success && result.data) {
        setGeneratedModules(result.data);
        showToast(`Se han diseñado ${result.data.length} módulos.`, "success");
      } else {
        showToast(result.error || "Error al generar módulos", "error");
      }
    } catch (error) {
      showToast("Error de conexión con el servidor", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedModules) return;

    setIsSaving(true);
    try {
      const result = await bulkCreateModules(courseId, generatedModules);
      if (result.success) {
        showToast("Módulos agregados correctamente.", "success");
        setGeneratedModules(null);
        setInput("");
      } else {
        showToast(result.error || "Error al guardar módulos", "error");
      }
    } catch (error) {
      showToast("Error al guardar en la base de datos", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="bg-zinc-100 dark:bg-zinc-800/50 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-700 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🪄</span>
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Generador Masivo de Módulos (IA)</h4>
          <p className="text-xs text-zinc-500 font-medium mt-1">Pega tu lista de módulos y Gemini diseñará los objetivos y descripciones.</p>
        </div>
      </div>

      <div className="space-y-6">
        <textarea
          placeholder="Ej: Módulo 1: Intro a SQL&#10;Módulo 2: Instalación de PostgreSQL&#10;Módulo 3: Consultas básicas..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-6 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-3xl outline-none focus:ring-2 focus:ring-blue-500 resize-none h-40 transition-all shadow-inner font-medium"
        />

        <button
          onClick={handleGenerate}
          disabled={isGenerating || isSaving}
          className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10 dark:shadow-white/10"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Diseñando Estructura...
            </>
          ) : (
            "Diseñar Módulos con IA"
          )}
        </button>

        {generatedModules && (
          <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 animate-in fade-in slide-in-from-top-4">
            <h5 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-2">Vista Previa de los Módulos</h5>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {generatedModules.map((m, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-400">
                    {m.order}
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-900 dark:text-white">{m.translations[0].title}</p>
                    <p className="text-[10px] text-zinc-500 font-medium truncate w-64">{m.translations[1].title}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
            >
              {isSaving ? "Guardando..." : "Confirmar y Agregar al Curso"}
            </button>
            <p className="text-[9px] text-zinc-500 text-center font-bold px-4">
              * Los módulos se agregarán al final de la lista actual sin borrar nada.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
