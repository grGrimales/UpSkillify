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
    const { topicId, completed } = await req.json();

    if (!topicId || typeof topicId !== "string") {
      return NextResponse.json({ message: "Invalid topicId" }, { status: 400 });
    }
    if (typeof completed !== "boolean") {
      return NextResponse.json({ message: "Invalid completed value" }, { status: 400 });
    }

    if (completed) {
      await prisma.userProgress.upsert({
        where: {
          userId_topicId: {
            userId: session.user.id,
            topicId,
          },
        },
        update: { completed: true },
        create: {
          userId: session.user.id,
          topicId,
          completed: true,
        },
      });
    } else {
      await prisma.userProgress.deleteMany({
        where: {
          userId: session.user.id,
          topicId,
        },
      });
    }

    return NextResponse.json({ message: "Progress updated" });
  } catch (error) {
    console.error("Progress API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
