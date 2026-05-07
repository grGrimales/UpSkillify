import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { Language } from "@prisma/client";

async function getCourseData(slug: string, lang: Language, userId?: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      translations: {
        where: { language: lang }
      },
      modules: {
        orderBy: { order: "asc" },
        include: {
          translations: {
            where: { language: lang }
          },
          topics: { 
            orderBy: { order: "asc" },
            include: {
              translations: {
                where: { language: lang }
              },
              userProgress: userId ? {
                where: { userId }
              } : false
            }
          },
          challenges: { 
            orderBy: { order: "asc" },
            include: {
              translations: {
                where: { language: lang }
              }
            }
          },
          exams: { 
            orderBy: { order: "asc" },
            include: {
              translations: {
                where: { language: lang }
              }
            }
          },
        },
      },
    },
  });

  if (!course) return null;

  // Flatten translations for easier UI usage
  return {
    ...course,
    title: course.translations[0]?.title || "Untranslated",
    description: course.translations[0]?.description || "",
    modules: course.modules.map(module => ({
      ...module,
      title: module.translations[0]?.title || "Untranslated",
      description: module.translations[0]?.description || "",
      topics: module.topics.map(topic => ({
        ...topic,
        title: topic.translations[0]?.title || "Untranslated"
      })),
      challenges: module.challenges.map(challenge => ({
        ...challenge,
        title: challenge.translations[0]?.title || "Untranslated"
      })),
      exams: module.exams.map(exam => ({
        ...exam,
        title: exam.translations[0]?.title || "Untranslated"
      }))
    }))
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Language) || Language.ES;

  const course = await getCourseData(slug, lang, session?.user?.id);

  if (!course) {
    notFound();
  }

  // Calculate overall progress
  const allTopics = course.modules.flatMap(m => m.topics);
  const completedTopicsCount = allTopics.filter(t => t.userProgress && t.userProgress.length > 0).length;
  const overallProgress = allTopics.length > 0 ? Math.round((completedTopicsCount / allTopics.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Course Header */}
      <div className="mb-12">
        <Link 
          href="/" 
          className="text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white transition-colors mb-4 inline-block"
        >
          {lang === "ES" ? "← Volver a Cursos" : "← Back to Courses"}
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl">
              {course.description}
            </p>
          </div>
          
          {session && allTopics.length > 0 && (
            <div className="w-full md:w-64 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold">{lang === "ES" ? "Tu Progreso" : "Your Progress"}</span>
                <span className="text-sm font-bold text-blue-600">{overallProgress}%</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-zinc-400 mt-2 text-center uppercase tracking-wider font-bold">
                {completedTopicsCount} {lang === "ES" ? "de" : "of"} {allTopics.length} {lang === "ES" ? "temas completados" : "topics completed"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold border-b border-zinc-200 dark:border-zinc-800 pb-2">
          {lang === "ES" ? "Contenido del Curso" : "Course Content"}
        </h2>
        
        {course.modules.length > 0 ? (
          course.modules.map((module) => {
            const moduleCompletedCount = module.topics.filter(t => t.userProgress && t.userProgress.length > 0).length;
            const moduleProgress = module.topics.length > 0 ? Math.round((moduleCompletedCount / module.topics.length) * 100) : 0;

            return (
              <div key={module.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold">
                      {module.order}. {module.title}
                    </h3>
                    {module.description && (
                      <p className="text-zinc-500 text-sm mt-1">{module.description}</p>
                    )}
                  </div>
                  
                  {session && module.topics.length > 0 && (
                    <div className="flex items-center gap-4 min-w-[150px]">
                      <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${moduleProgress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                          style={{ width: `${moduleProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold tabular-nums w-8 text-right">
                        {moduleProgress}%
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {/* Topics */}
                  {module.topics.map((topic) => {
                    const isCompleted = topic.userProgress && topic.userProgress.length > 0;
                    return (
                      <div key={topic.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                            isCompleted 
                              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" 
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                          }`}>
                            {isCompleted ? "✓" : topic.order}
                          </div>
                          <span className={`font-medium ${isCompleted ? "text-zinc-400 line-through" : ""}`}>
                            {topic.title}
                          </span>
                        </div>
                        <Link 
                          href={`/courses/${slug}/topics/${topic.id}`}
                          className="text-sm px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 transition-colors"
                        >
                          {isCompleted 
                            ? (lang === "ES" ? "Repasar" : "Review") 
                            : (lang === "ES" ? "Empezar" : "Start")}
                        </Link>
                      </div>
                    );
                  })}

                  {/* Exams */}
                  {module.exams.length > 0 && module.exams.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-900/5 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📝</span>
                        <span className="font-medium italic">{exam.title}</span>
                      </div>
                      <Link 
                        href={`/courses/${slug}/exams/${exam.id}`}
                        className="text-sm px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md hover:bg-emerald-200 transition-colors font-bold"
                      >
                        {lang === "ES" ? "Tomar Examen" : "Take Exam"}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
            <p className="text-zinc-500">{lang === "ES" ? "Este curso aún no tiene módulos." : "This course doesn't have any modules yet."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
