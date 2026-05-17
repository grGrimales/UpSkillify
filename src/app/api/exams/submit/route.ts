import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { examId, questionId, selectedOption, isCorrect, isFinished, score } = await req.json();

    if (!examId || typeof examId !== "string") {
      return NextResponse.json({ message: "Invalid examId" }, { status: 400 });
    }
    if (isFinished && (typeof score !== "number" || score < 0)) {
      return NextResponse.json({ message: "Invalid score" }, { status: 400 });
    }

    // 1. Get or Create an active attempt (isFinished: false)
    let attempt = await prisma.examAttempt.findUnique({
      where: {
        userId_examId_isFinished: {
          userId: session.user.id,
          examId,
          isFinished: false,
        },
      },
    });

    if (!attempt) {
      attempt = await prisma.examAttempt.create({
        data: {
          userId: session.user.id,
          examId,
        },
      });
    }

    // 2. Save the answer for the specific question
    if (questionId !== undefined) {
      await prisma.examAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId,
          },
        },
        update: {
          selectedOption,
          isCorrect,
        },
        create: {
          attemptId: attempt.id,
          questionId,
          selectedOption,
          isCorrect,
        },
      });
    }

    // 3. If finished, mark the attempt as finished and save final score
    if (isFinished) {
      await prisma.examAttempt.update({
        where: { id: attempt.id },
        data: {
          isFinished: true,
          score,
        },
      });
    }

    return NextResponse.json({ message: "Progress saved", attemptId: attempt.id });
  } catch (error) {
    console.error("Exam Progress API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
