"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Language } from "@prisma/client";

interface QuestionInput {
  questionEs: string;
  questionEn: string;
  optionsEs: string[];
  optionsEn: string[];
  correctOption: number;
  explanationEs: string;
  explanationEn: string;
}

export async function saveExamAction(moduleId: string, questions: QuestionInput[]) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    // Get the next order for the exam in this module
    const lastExam = await prisma.exam.findFirst({
      where: { moduleId },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastExam?.order || 0) + 1;

    // Create the exam and its translations
    const exam = await prisma.exam.create({
      data: {
        moduleId,
        order: nextOrder,
        translations: {
          create: [
            { language: Language.ES, title: `Examen Final - Módulo ${nextOrder}` },
            { language: Language.EN, title: `Final Exam - Module ${nextOrder}` },
          ],
        },
        questions: {
          create: questions.map((q) => ({
            translations: {
              create: [
                {
                  language: Language.ES,
                  text: q.questionEs,
                  options: q.optionsEs,
                  explanation: q.explanationEs,
                  correctOption: q.correctOption,
                },
                {
                  language: Language.EN,
                  text: q.questionEn,
                  options: q.optionsEn,
                  explanation: q.explanationEn,
                  correctOption: q.correctOption,
                },
              ],
            },
          })),
        },
      },
    });

    revalidatePath(`/admin/courses/[id]/modules/${moduleId}`, "page");
    return { success: true, examId: exam.id };
  } catch (error) {
    console.error("Error saving exam:", error);
    return { success: false, error: "Error al guardar el examen en la base de datos." };
  }
}
