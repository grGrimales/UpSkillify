import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Language } from "@prisma/client";
import ModuleListEditor from "@/components/admin/ModuleListEditor";
import CourseStatusToggle from "@/components/admin/CourseStatusToggle";
import CreateModuleForm from "@/components/admin/CreateModuleForm";
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
            <CreateModuleForm 
              courseId={course.id} 
              nextOrder={course.modules.length + 1} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
