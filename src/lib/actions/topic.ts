"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Language } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createTopic(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

  const moduleId = formData.get("moduleId") as string;
  const courseId = formData.get("courseId") as string;
  const order = parseInt(formData.get("order") as string);
  const titleEs = formData.get("title_es") as string;
  const titleEn = formData.get("title_en") as string;

  try {
    await prisma.topic.create({
      data: {
        moduleId,
        order,
        translations: {
          create: [
            { language: Language.ES, title: titleEs, content: "# " + titleEs },
            { language: Language.EN, title: titleEn, content: "# " + titleEn }
          ]
        }
      }
    });

    revalidatePath(`/admin/courses/${courseId}/modules/${moduleId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to create topic:", error);
    return { success: false, error: "Failed to create topic" };
  }
}

export async function updateTopicOrder(topicId: string, newOrder: number, courseId: string, moduleId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

  try {
    await prisma.topic.update({
      where: { id: topicId },
      data: { order: newOrder }
    });

    revalidatePath(`/admin/courses/${courseId}/modules/${moduleId}`);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function deleteTopic(topicId: string, courseId: string, moduleId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

  try {
    await prisma.topic.delete({
      where: { id: topicId }
    });

    revalidatePath(`/admin/courses/${courseId}/modules/${moduleId}`);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function saveTopicJson(topicId: string, jsonData: string, courseId: string, moduleId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

  try {
    const data = JSON.parse(jsonData);
    
    await prisma.topic.update({
      where: { id: topicId },
      data: {
        order: data.order,
        translations: {
          deleteMany: {},
          create: data.translations.map((t: any) => ({
            language: t.language as Language,
            title: t.title,
            content: t.content,
            videoUrl: t.videoUrl
          }))
        }
      }
    });

    revalidatePath(`/admin/courses/${courseId}/modules/${moduleId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Invalid JSON or database error" };
  }
}

export async function getTopicsContent(topicIds: string[], language: Language) {
  try {
    const topics = await prisma.topic.findMany({
      where: {
        id: { in: topicIds }
      },
      orderBy: {
        order: "asc"
      },
      include: {
        translations: {
          where: {
            language: language
          }
        }
      }
    });

    return topics.map(topic => ({
      id: topic.id,
      title: topic.translations[0]?.title || "Untitled",
      content: topic.translations[0]?.content || ""
    }));
  } catch (error) {
    console.error("Failed to fetch topics content:", error);
    throw new Error("Failed to fetch topics content");
  }
}
