import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { Language } from "@prisma/client";
import ExamClient from "@/components/courses/ExamClient";

async function getExamData(examId: string, lang: Language, userId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      translations: {
        where: { language: lang }
      },
      questions: {
        orderBy: { id: "asc" },
        include: {
          translations: {
            where: { language: lang }
          }
        }
      },
      module: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!exam) return null;

  // Get current active attempt
  const attempt = await prisma.examAttempt.findUnique({
    where: {
      userId_examId_isFinished: {
        userId,
        examId,
        isFinished: false,
      },
    },
    include: {
      answers: true
    }
  });

  // Flatten translations
  return { 
    exam: {
      ...exam,
      title: exam.translations[0]?.title || "Untranslated",
      questions: exam.questions.map(q => ({
        ...q,
        text: q.translations[0]?.text || "Untranslated",
        options: q.translations[0]?.options || [],
        explanation: q.translations[0]?.explanation,
        correctOption: q.translations[0]?.correctOption ?? 0
      }))
    }, 
    attempt 
  };
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ slug: string; examId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { slug, examId } = await params;

  if (!session) {
    redirect(`/auth/login?callbackUrl=/courses/${slug}/exams/${examId}`);
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Language) || Language.ES;

  const data = await getExamData(examId, lang, session.user.id);

  if (!data) {
    notFound();
  }

  const { exam, attempt } = data;

  const initialQuestionIndex = attempt ? attempt.answers.length : 0;
  const initialScore = attempt ? attempt.answers.filter(a => a.isCorrect).length : 0;

  if (initialQuestionIndex >= exam.questions.length && exam.questions.length > 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">{lang === "ES" ? "Ya has completado las preguntas de este intento." : "You have already completed the questions in this attempt."}</h2>
          <Link href={`/courses/${slug}`} className="px-6 py-2 bg-black text-white rounded-lg">{lang === "ES" ? "Volver al Curso" : "Return to Course"}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-4">
      <ExamClient 
        examId={exam.id}
        examTitle={exam.title}
        questions={exam.questions}
        courseSlug={slug}
        initialQuestionIndex={initialQuestionIndex}
        initialScore={initialScore}
      />
    </div>
  );
}

import Link from "next/link";
