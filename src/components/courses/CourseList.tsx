"use client";

import { useState } from "react";
import Link from "next/link";
import { Language } from "@prisma/client";

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  moduleCount: number;
  isEnrolled: boolean;
}

interface CourseListProps {
  initialCourses: Course[];
  lang: Language;
  isLoggedIn: boolean;
}

export default function CourseList({ initialCourses, lang, isLoggedIn }: CourseListProps) {
  const [search, setSearch] = useState("");
  const [showOnlyEnrolled, setShowOnlyEnrolled] = useState(false);

  const filteredCourses = initialCourses.filter((course) => {
    const matchesSearch = 
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesEnrolled = showOnlyEnrolled ? course.isEnrolled : true;

    return matchesSearch && matchesEnrolled;
  });

  return (
    <section className="py-20 px-4 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-bold mb-2">
            {lang === "ES" ? "Explorar Cursos" : "Explore Courses"}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            {lang === "ES" ? "Elige tu próxima aventura" : "Choose your next learning adventure"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:min-w-[300px]">
            <input
              type="text"
              placeholder={lang === "ES" ? "Buscar cursos..." : "Search courses..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* My Courses Filter */}
          {isLoggedIn && (
            <button
              onClick={() => setShowOnlyEnrolled(!showOnlyEnrolled)}
              className={`px-4 py-2 rounded-xl border transition-all font-medium ${
                showOnlyEnrolled
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              {lang === "ES" ? "Mis Cursos" : "My Courses"}
            </button>
          )}
        </div>
      </div>

      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="group relative flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:border-blue-500/50 transition-all duration-300"
            >
              <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 relative">
                <div className="absolute inset-0 flex items-center justify-center text-zinc-400 font-bold text-lg uppercase tracking-widest">
                  {course.title.split(' ').map(w => w[0]).join('')}
                </div>
                {course.isEnrolled && (
                  <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                    {lang === "ES" ? "En curso" : "In Progress"}
                  </div>
                )}
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
                    {course.moduleCount} {lang === "ES" ? "Módulos" : "Modules"}
                  </span>
                  <span className="text-sm font-bold text-blue-600 group-hover:underline">
                    {lang === "ES" ? "Ver Detalles" : "View Details"} →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500">
            {lang === "ES" 
              ? "No se encontraron cursos con estos criterios." 
              : "No courses found with these criteria."}
          </p>
          {(search || showOnlyEnrolled) && (
            <button
              onClick={() => {
                setSearch("");
                setShowOnlyEnrolled(false);
              }}
              className="mt-4 text-blue-600 font-medium hover:underline"
            >
              {lang === "ES" ? "Limpiar filtros" : "Clear filters"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
