"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompleteButton({ 
  topicId, 
  initialCompleted,
  courseSlug,
  nextTopicId
}: { 
  topicId: string, 
  initialCompleted: boolean,
  courseSlug: string,
  nextTopicId: string | null
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, completed: !completed }),
      });

      if (res.ok) {
        setCompleted(!completed);
        
        // Auto-navigate to next topic if completing for the first time
        if (!completed && nextTopicId) {
          router.push(`/courses/${courseSlug}/topics/${nextTopicId}`);
        } else if (!completed && !nextTopicId) {
          // If it was the last topic, go back to course page
          router.push(`/courses/${courseSlug}`);
        } else {
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Failed to update progress", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-6 py-2 rounded-lg font-bold transition-all ${
        completed 
          ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
          : "bg-black text-white hover:opacity-90"
      } disabled:opacity-50`}
    >
      {loading ? "Updating..." : completed ? "✓ Completed" : "Mark as Completed"}
    </button>
  );
}
