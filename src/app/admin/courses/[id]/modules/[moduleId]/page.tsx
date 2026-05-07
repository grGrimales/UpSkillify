import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Language } from "@prisma/client";
import TopicListEditor from "@/components/admin/TopicListEditor";
import CreateTopicForm from "@/components/admin/CreateTopicForm";
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
  const nextOrder = moduleData.topics.length + 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8">
        <div>
          <Link
            href={`/admin/courses/${id}`}
            className="text-sm font-bold text-zinc-500 hover:text-black dark:hover:text-white flex items-center gap-2 mb-4 transition-colors"
          >
            ← Volver a {moduleData.course.translations[0]?.title}
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">
              {moduleData.order}
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">{titleEs}</h1>
              <p className="text-zinc-500 font-medium text-sm">
                {moduleData.topics.length} {moduleData.topics.length === 1 ? "tema" : "temas"} en este módulo
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: topic list */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black">Temas</h2>
            <span className="px-4 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-500">
              {moduleData.topics.length} en total
            </span>
          </div>
          <TopicListEditor
            courseId={id}
            moduleId={moduleId}
            topics={moduleData.topics}
          />
        </div>

        {/* Right: add topic form */}
        <div className="lg:col-span-4">
          <div className="sticky top-24">
            <CreateTopicForm courseId={id} moduleId={moduleId} nextOrder={nextOrder} />
          </div>
        </div>
      </div>
    </div>
  );
}
