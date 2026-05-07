import Link from "next/link";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { Language } from "@prisma/client";

async function getCourses(lang: Language) {
  const courses = await prisma.course.findMany({
    where: { published: true },
    include: {
      translations: {
        where: { language: lang }
      },
      _count: {
        select: { modules: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return courses.map(course => ({
    ...course,
    title: course.translations[0]?.title || "Untranslated",
    description: course.translations[0]?.description || ""
  }));
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // Get language from cookie (set by LanguageContext reload)
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Language) || Language.ES;

  const courses = await getCourses(lang);

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
      <section className="py-20 px-4 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">{lang === "ES" ? "Explorar Cursos" : "Explore Courses"}</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              {lang === "ES" ? "Elige tu próxima aventura" : "Choose your next learning adventure"}
            </p>
          </div>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div 
                key={course.id} 
                className="group relative flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-400 font-bold text-lg uppercase tracking-widest">
                    {course.title.split(' ').map(w => w[0]).join('')}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-2 mb-4 flex-1">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      {course._count.modules} {lang === "ES" ? "Módulos" : "Modules"}
                    </span>
                    <Link 
                      href={`/courses/${course.slug}`}
                      className="text-sm font-bold text-blue-600 hover:underline"
                    >
                      {lang === "ES" ? "Ver Detalles" : "View Details"} →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500">{lang === "ES" ? "No hay cursos disponibles." : "No courses available."}</p>
          </div>
        )}
      </section>
    </div>
  );
}
