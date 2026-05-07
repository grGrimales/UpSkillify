import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Language } from "@prisma/client";
import TopicJsonEditor from "@/components/admin/TopicJsonEditor";
import Link from "next/link";

async function getTopicData(topicId: string) {
  return await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      translations: true,
      module: {
        include: {
          translations: true,
          course: {
            include: {
              translations: { where: { language: Language.ES } }
            }
          }
        }
      }
    }
  });
}

export default async function AdminTopicEditorPage({
  params
}: {
  params: Promise<{ id: string; moduleId: string; topicId: string }>
}) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/");

  const { id, moduleId, topicId } = await params;
  const topicData = await getTopicData(topicId);

  if (!topicData) notFound();

  const titleEs = topicData.translations.find(t => t.language === Language.ES)?.title || "Sin título";
  const moduleTitleEs = topicData.module.translations.find(t => t.language === Language.ES)?.title || "Módulo";
  const courseTitleEs = topicData.module.course.translations[0]?.title || "Curso";

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Breadcrumb header */}
      <div className="mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-8">
        <nav className="flex items-center gap-2 text-sm font-bold text-zinc-400 mb-4 flex-wrap">
          <Link href={`/admin/courses/${id}`} className="hover:text-black dark:hover:text-white transition-colors">
            {courseTitleEs}
          </Link>
          <span>/</span>
          <Link href={`/admin/courses/${id}/modules/${moduleId}`} className="hover:text-black dark:hover:text-white transition-colors">
            {moduleTitleEs}
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-white">{titleEs}</span>
        </nav>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-xl">
            {topicData.order}
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">{titleEs}</h1>
            <p className="text-zinc-500 font-medium text-sm">Editor de contenido JSON</p>
          </div>
        </div>
      </div>

      <TopicJsonEditor
        topicId={topicId}
        moduleId={moduleId}
        courseId={id}
        topic={{
          order: topicData.order,
          translations: topicData.translations.map(t => ({
            language: t.language,
            title: t.title,
            content: t.content,
            videoUrl: t.videoUrl
          }))
        }}
      />
    </div>
  );
}
