"use client";

import { createCourse } from "@/lib/actions/course";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function NewCoursePage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const result = await createCourse(formData);
    setLoading(false);

    if (result.success) {
      router.push("/admin/courses");
    } else {
      setError(result.error || "Failed to create course");
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/admin/courses" className="text-sm font-bold text-zinc-500 hover:text-black">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-4">Create New Course</h1>
      </div>

      <form action={handleSubmit} className="space-y-12">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100 text-center">
            {error}
          </div>
        )}

        {/* Global Settings */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-b pb-2">1. Global Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Slug (URL identifier)</label>
              <input 
                name="slug" 
                required 
                placeholder="terraform-advanced"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
              <p className="text-xs text-zinc-500 mt-1">Unique ID used in the URL. No spaces.</p>
            </div>
            <div className="flex items-center gap-2 pt-8">
              <input type="checkbox" name="published" id="published" className="w-5 h-5" />
              <label htmlFor="published" className="text-sm font-bold">Publish immediately</label>
            </div>
          </div>
        </section>

        {/* Spanish Translation */}
        <section className="space-y-6 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇪🇸</span>
            <h2 className="text-xl font-bold">Spanish Content (ES)</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Título del Curso</label>
              <input 
                name="title_es" 
                required 
                placeholder="Curso Avanzado de Terraform"
                className="w-full px-4 py-2 border rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Descripción</label>
              <textarea 
                name="description_es" 
                rows={3}
                placeholder="Describe qué aprenderán los alumnos..."
                className="w-full px-4 py-2 border rounded-lg outline-none"
              ></textarea>
            </div>
          </div>
        </section>

        {/* English Translation */}
        <section className="space-y-6 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇺🇸</span>
            <h2 className="text-xl font-bold">English Content (EN)</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Course Title</label>
              <input 
                name="title_en" 
                required 
                placeholder="Advanced Terraform Course"
                className="w-full px-4 py-2 border rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Description</label>
              <textarea 
                name="description_en" 
                rows={3}
                placeholder="Describe what students will learn..."
                className="w-full px-4 py-2 border rounded-lg outline-none"
              ></textarea>
            </div>
          </div>
        </section>

        <div className="pt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
