"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Language } from "@prisma/client";
import { enrollInCourse, unenrollFromCourse } from "@/lib/actions/course";

interface EnrollmentButtonProps {
  courseId: string;
  isEnrolled: boolean;
  lang: Language;
}

export default function EnrollmentButton({ courseId, isEnrolled, lang }: EnrollmentButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const result = await enrollInCourse(courseId);
      if (result.success) {
        router.refresh();
      } else {
        alert(lang === "ES" ? "Error al inscribirse" : "Error enrolling");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!confirm(lang === "ES" ? "¿Estás seguro de que quieres desinscribirte?" : "Are you sure you want to unenroll?")) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await unenrollFromCourse(courseId);
      if (result.success) {
        router.refresh();
      } else {
        alert(lang === "ES" ? "Error al desinscribirse" : "Error unenrolling");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (isEnrolled) {
    return (
      <button
        onClick={handleUnenroll}
        disabled={loading}
        className="px-6 py-2 bg-white dark:bg-zinc-900 text-red-600 border border-red-200 dark:border-red-900/30 rounded-full font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50"
      >
        {loading ? (lang === "ES" ? "Procesando..." : "Processing...") : (lang === "ES" ? "Desinscribirme" : "Unenroll")}
      </button>
    );
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="px-8 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
    >
      {loading ? (lang === "ES" ? "Procesando..." : "Processing...") : (lang === "ES" ? "Inscribirme Gratis" : "Enroll for Free")}
    </button>
  );
}
