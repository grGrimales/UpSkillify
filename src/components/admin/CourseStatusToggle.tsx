"use client";

import { toggleCourseStatus } from "@/lib/actions/course";
import { useToast } from "@/context/ToastContext";
import { useState } from "react";

export default function CourseStatusToggle({ 
  courseId, 
  initialStatus 
}: { 
  courseId: string, 
  initialStatus: boolean 
}) {
  const [isPublished, setIsPublished] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleToggle = async () => {
    setLoading(true);
    const result = await toggleCourseStatus(courseId);
    setLoading(false);

    if (result.success) {
      setIsPublished(!isPublished);
      showToast(
        !isPublished ? "Curso publicado correctamente" : "Curso movido a borradores", 
        "success"
      );
    } else {
      showToast("Error al cambiar el estado del curso", "error");
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
        ${isPublished 
          ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}
        disabled:opacity-50
      `}
    >
      {loading ? "Actualizando..." : isPublished ? "Mover a Borradores" : "Publicar Curso"}
    </button>
  );
}
