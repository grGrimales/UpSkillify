"use client";

import { useState } from "react";
import { updateModule, deleteModule } from "@/lib/actions/module";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";

interface ModuleListEditorProps {
  courseId: string;
  modules: any[];
}

export default function ModuleListEditor({ courseId, modules }: ModuleListEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleDelete = async (moduleId: string) => {
    if (!confirm("¿Estás seguro de eliminar este módulo y todos sus temas?")) return;
    const result = await deleteModule(moduleId, courseId);
    if (result.success) {
      showToast("Módulo eliminado correctamente", "success");
    } else {
      showToast("Error al eliminar el módulo", "error");
    }
  };

  return (
    <div className="space-y-6">
      {modules.map((mod) => {
        const titleEs = mod.translations.find((t: any) => t.language === "ES")?.title || "";
        const titleEn = mod.translations.find((t: any) => t.language === "EN")?.title || "";
        const descEs = mod.translations.find((t: any) => t.language === "ES")?.description || "";
        const descEn = mod.translations.find((t: any) => t.language === "EN")?.description || "";

        return (
          <div 
            key={mod.id} 
            className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 transition-all hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-none"
          >
            {editingId === mod.id ? (
              <form action={async (formData) => {
                const result = await updateModule(formData);
                if (result.success) {
                  showToast("Módulo actualizado correctamente", "success");
                  setEditingId(null);
                } else {
                  showToast("Error al actualizar el módulo", "error");
                }
              }} className="space-y-4">
                <input type="hidden" name="moduleId" value={mod.id} />
                <input type="hidden" name="courseId" value={courseId} />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Orden</label>
                    <input name="order" type="number" defaultValue={mod.order} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Título (ES)</label>
                    <input name="title_es" defaultValue={titleEs} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Título (EN)</label>
                    <input name="title_en" defaultValue={titleEn} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Descripción (ES)</label>
                    <textarea name="description_es" defaultValue={descEs} rows={2} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Descripción (EN)</label>
                    <textarea name="description_en" defaultValue={descEn} rows={2} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingId(null)}
                    className="px-6 py-2 text-sm font-bold text-zinc-500 hover:text-black"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center font-black text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {mod.order}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{titleEs}</h3>
                    <p className="text-sm text-zinc-500 line-clamp-1">{descEs || "Sin descripción"}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-bold uppercase tracking-wider text-zinc-500">
                        {mod.topics.length} Temas
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link 
                    href={`/admin/courses/${courseId}/modules/${mod.id}`}
                    className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all text-center"
                  >
                    Gestionar Temas
                  </Link>
                  <button 
                    onClick={() => setEditingId(mod.id)}
                    className="p-2.5 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                    title="Editar Módulo"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(mod.id)}
                    className="p-2.5 text-zinc-400 hover:text-red-600 transition-colors"
                    title="Eliminar Módulo"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
