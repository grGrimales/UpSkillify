import Link from "next/link";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Language } from "@prisma/client";

async function getAdminCourses(lang: Language) {
  const courses = await prisma.course.findMany({
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
  }));
}

export default async function AdminCoursesPage() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== "ADMIN") {
    redirect("/");
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Language) || Language.ES;
  const courses = await getAdminCourses(lang);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-zinc-500">Manage your educational content</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          + Create New Course
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Course Title</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Modules</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold">{course.title}</div>
                  <div className="text-xs text-zinc-500 font-mono">{course.slug}</div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {course._count.modules} Modules
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    course.published 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {course.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <Link 
                    href={`/admin/courses/${course.id}`}
                    className="text-sm font-bold text-blue-600 hover:underline"
                  >
                    Edit Content
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-500 italic">No courses found. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
