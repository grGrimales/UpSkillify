import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Language } from "@prisma/client";
import { createModule } from "@/lib/actions/module";
import ModuleListEditor from "@/components/admin/ModuleListEditor";
import CourseStatusToggle from "@/components/admin/CourseStatusToggle";
import Link from "next/link";

async function getCourseWithContent(id: string) {
  return await prisma.course.findUnique({
    where: { id },
    include: {
      translations: { where: { language: Language.ES } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          translations: true,
          topics: {
            include: { translations: true }
          }
        }
      }
    }
  });
}

export default async function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const course = await getCourseWithContent(id);

  if (!course) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link href="/admin/courses" className="text-sm font-bold text-zinc-500 hover:text-black mb-4 inline-block">
            ← Volver al Dashboard
          </Link>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-5xl font-black tracking-tight">{course.translations[0]?.title || "Curso sin título"}</h1>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              course.published 
                ? "bg-emerald-100 text-emerald-700" 
                : "bg-amber-100 text-amber-700"
            }`}>
              {course.published ? "Publicado" : "Borrador"}
            </span>
          </div>
          <p className="text-zinc-500 font-mono text-sm">{course.slug}</p>
        </div>
        
        <div className="flex gap-4">
           <CourseStatusToggle courseId={course.id} initialStatus={course.published} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Module Management */}
        <div className="lg:col-span-8 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black">Módulos</h2>
              <span className="px-4 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-500">
                {course.modules.length} Módulos en total
              </span>
            </div>
            
            {course.modules.length > 0 ? (
              <ModuleListEditor courseId={course.id} modules={course.modules} />
            ) : (
              <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] text-zinc-400">
                <p className="font-bold">No hay módulos creados aún</p>
                <p className="text-sm">Utiliza el formulario lateral para añadir el primero.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right: Creation Forms */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-8">
            <section className="bg-zinc-950 text-white rounded-[2.5rem] p-8 shadow-2xl shadow-zinc-200/50 dark:shadow-none">
              <h2 className="text-2xl font-black mb-6">Nuevo Módulo</h2>
              <form action={async (formData) => { await createModule(formData); }} className="space-y-4">
                <input type="hidden" name="courseId" value={course.id} />
                
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Orden de aparición</label>
                  <input 
                    name="order" 
                    type="number" 
                    required 
                    defaultValue={course.modules.length + 1} 
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
          </div>
        </div>
      </div>
    </div>
  );
}
