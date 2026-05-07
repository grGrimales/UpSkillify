import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Language } from "@prisma/client";
import TopicBulkEditor from "@/components/admin/TopicBulkEditor";
import Link from "next/link";

async function getModuleData(moduleId: string) {
  return await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      translations: true,
      course: {
        include: {
          translations: { where: { language: Language.ES } }
        }
      },
      topics: {
        orderBy: { order: "asc" },
        include: { translations: true }
      }
    }
  });
}

export default async function AdminModuleTopicsPage({ 
  params 
}: { 
  params: Promise<{ id: string; moduleId: string }> 
}) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/");

  const { id, moduleId } = await params;
  const moduleData = await getModuleData(moduleId);

  if (!moduleData) notFound();

  const titleEs = moduleData.translations.find(t => t.language === Language.ES)?.title || "Sin título";

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
        <div>
          <Link 
            href={`/admin/courses/${id}`} 
            className="text-sm font-bold text-zinc-500 hover:text-black flex items-center gap-2 mb-4"
          >
            ← Volver a {moduleData.course.translations[0]?.title}
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">
              {moduleData.order}
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">{titleEs}</h1>
              <p className="text-zinc-500 font-medium">Gestión masiva de temas (JSON)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-[2.5rem] p-4 md:p-10 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Editor de Contenido</h2>
          <p className="text-zinc-500 text-sm">Modifica el JSON para actualizar los temas de este módulo en tiempo real.</p>
        </div>
        
        <TopicBulkEditor 
          moduleId={moduleData.id} 
          courseId={id} 
          existingTopics={moduleData.topics}
        />
      </div>
    </div>
  );
}
