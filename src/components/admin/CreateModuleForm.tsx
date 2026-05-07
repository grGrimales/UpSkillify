"use client";

import { createModule } from "@/lib/actions/module";
import { useToast } from "@/context/ToastContext";

export default function CreateModuleForm({ courseId, nextOrder }: { courseId: string, nextOrder: number }) {
  const { showToast } = useToast();

  async function handleAction(formData: FormData) {
    const result = await createModule(formData);
    if (result.success) {
      showToast("Módulo creado correctamente", "success");
      // Optionally reset form here if needed, but Next.js usually handles this with revalidatePath
    } else {
      showToast(result.error || "Error al crear el módulo", "error");
    }
  }

  return (
    <section className="bg-zinc-950 text-white rounded-[2.5rem] p-8 shadow-2xl shadow-zinc-200/50 dark:shadow-none">
      <h2 className="text-2xl font-black mb-6">Nuevo Módulo</h2>
      <form action={handleAction} className="space-y-4">
        <input type="hidden" name="courseId" value={courseId} />
        
        <div>
          <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Orden de aparición</label>
          <input 
            name="order" 
            type="number" 
            required 
            defaultValue={nextOrder} 
            className="w-full px-5 py-3 bg-white/10 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Título (ES)</label>
            <input name="title_es" required className="w-full px-5 py-3 bg-white/10 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ej: Fundamentos de React" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Título (EN)</label>
            <input name="title_en" required className="w-full px-5 py-3 bg-white/10 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ej: React Fundamentals" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Descripción (ES)</label>
            <textarea name="description_es" rows={2} className="w-full px-5 py-3 bg-white/10 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Descripción (EN)</label>
            <textarea name="description_en" rows={2} className="w-full px-5 py-3 bg-white/10 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
        </div>

        <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all mt-4 shadow-lg shadow-blue-500/20">
          Crear Módulo
        </button>
      </form>
    </section>
  );
}
