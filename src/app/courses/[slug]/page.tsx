import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { Language } from "@prisma/client";
import ModuleAccordion from "./ModuleAccordion";
import EnrollmentButton from "@/components/courses/EnrollmentButton";

async function getCourseData(slug: string, lang: Language, userId?: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      translations: {
        where: { language: lang }
      },
      enrollments: userId ? {
        where: { userId }
      } : false,
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

  const isEnrolled = course.enrollments && course.enrollments.length > 0;

  // Flatten translations for easier UI usage
  return {
    ...course,
    isEnrolled,
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

  const isEnrolled = course.isEnrolled;

  // Calculate overall progress
  const allTopics = course.modules.flatMap(m => m.topics);
  const completedTopicsCount = allTopics.filter(t => t.userProgress && t.userProgress.length > 0).length;
  const overallProgress = allTopics.length > 0 ? Math.round((completedTopicsCount / allTopics.length) * 100) : 0;

  // Determine which module to open by default (only for logged-in users)
  let currentModuleId: string | null = null;
  if (session) {
    const partial = course.modules.find((m) => {
      const done = m.topics.filter(t => t.userProgress && t.userProgress.length > 0).length;
      return done > 0 && done < m.topics.length;
    });
    if (partial) {
      currentModuleId = partial.id;
    } else {
      const next = course.modules.find((m) =>
        m.topics.length > 0 &&
        m.topics.every(t => !t.userProgress || t.userProgress.length === 0)
      );
      currentModuleId = next?.id ?? course.modules[course.modules.length - 1]?.id ?? null;
    }
  }

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
            
            {session && (
              <div className="mt-8">
                <EnrollmentButton 
                  courseId={course.id} 
                  isEnrolled={isEnrolled} 
                  lang={lang} 
                />
              </div>
            )}
          </div>
          
          {session && isEnrolled && allTopics.length > 0 && (
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
          course.modules.map((module) => (
            <ModuleAccordion
              key={module.id}
              module={module}
              slug={slug}
              lang={lang}
              isLoggedIn={!!session}
              isEnrolled={isEnrolled}
              defaultOpen={module.id === currentModuleId}
            />
          ))
        ) : (
          <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
            <p className="text-zinc-500">{lang === "ES" ? "Este curso aún no tiene módulos." : "This course doesn't have any modules yet."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
