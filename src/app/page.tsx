import Link from "next/link";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { Language } from "@prisma/client";
import CourseList from "@/components/courses/CourseList";

async function getCourses(lang: Language, userId?: string) {
  const courses = await prisma.course.findMany({
    where: { published: true },
    include: {
      translations: {
        where: { language: lang }
      },
      _count: {
        select: { modules: true },
      },
      enrollments: userId ? {
        where: { userId }
      } : false,
      modules: {
        select: {
          topics: {
            select: { 
              id: true,
              userProgress: userId ? {
                where: { userId },
                select: { createdAt: true }
              } : false
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  const processedCourses = courses.map(course => {
    const topicsWithProgress = course.modules.flatMap(m => m.topics);
    
    // Find the latest progress date for this course
    let latestActivity = new Date(0);
    const isEnrolled = course.enrollments && course.enrollments.length > 0;

    topicsWithProgress.forEach(topic => {
      if (topic.userProgress && topic.userProgress.length > 0) {
        const progressDate = new Date(topic.userProgress[0].createdAt);
        if (progressDate > latestActivity) {
          latestActivity = progressDate;
        }
      }
    });

    return {
      id: course.id,
      slug: course.slug,
      title: course.translations[0]?.title || "Untranslated",
      description: course.translations[0]?.description || "",
      moduleCount: course._count.modules,
      isEnrolled,
      latestActivity: latestActivity.getTime()
    };
  });

  // If logged in, sort by latest activity first, then by default
  if (userId) {
    return processedCourses.sort((a, b) => {
      if (a.latestActivity > 0 || b.latestActivity > 0) {
        return b.latestActivity - a.latestActivity;
      }
      return 0; // Maintain original order for courses with no activity
    });
  }

  return processedCourses;
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // Get language from cookie (set by LanguageContext reload)
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Language) || Language.ES;

  const courses = await getCourses(lang, session?.user?.id);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            {lang === "ES" ? "Domina tus habilidades con" : "Master Your Tech Skills with" } <span className="text-blue-600">UpSkillify</span>
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10">
            {lang === "ES" 
              ? "Aprende con retos prácticos, módulos guiados y exámenes expertos." 
              : "Learn with practical challenges, guided modules, and expert-crafted exams."}
          </p>
          {!session && (
            <div className="flex gap-4 justify-center">
              <Link
                href="/auth/register"
                className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:opacity-90 transition-opacity"
              >
                {lang === "ES" ? "Empezar" : "Get Started"}
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-3 bg-white dark:bg-zinc-800 text-black dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-full font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                {lang === "ES" ? "Entrar" : "Login"}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Courses Grid */}
      <CourseList 
        initialCourses={courses} 
        lang={lang} 
        isLoggedIn={!!session} 
      />
    </div>
  );
}
