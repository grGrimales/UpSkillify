"use client";

import { createTopic } from "@/lib/actions/topic";
import { useToast } from "@/context/ToastContext";

export default function CreateTopicForm({ courseId, moduleId, nextOrder }: { courseId: string, moduleId: string, nextOrder: number }) {
  const { showToast } = useToast();

  async function handleAction(formData: FormData) {
    const result = await createTopic(formData);
    if (result.success) {
      showToast("Tema creado correctamente", "success");
    } else {
      showToast(result.error || "Error al crear el tema", "error");
    }
  }

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-sm">
      <h3 className="text-xl font-black mb-6">Agregar Nuevo Tema</h3>
      <form action={handleAction} className="space-y-4">
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="moduleId" value={moduleId} />
        
        <div>
          <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Orden</label>
          <input 
            name="order" 
            type="number" 
            required 
            defaultValue={nextOrder} 
            className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Título (ES)</label>
            <input name="title_es" required className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" placeholder="Ej: Intro a Variables" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Título (EN)</label>
            <input name="title_en" required className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" placeholder="Ej: Intro to Variables" />
          </div>
        </div>

        <button type="submit" className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm uppercase tracking-widest transition-all mt-4 hover:opacity-90">
          Crear Tema
        </button>
      </form>
    </section>
  );
}
