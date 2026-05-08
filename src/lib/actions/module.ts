"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Language } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createModule(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

  const courseId = formData.get("courseId") as string;
  const order = parseInt(formData.get("order") as string);
  const titleEs = formData.get("title_es") as string;
  const descriptionEs = formData.get("description_es") as string;
  const titleEn = formData.get("title_en") as string;
  const descriptionEn = formData.get("description_en") as string;

  try {
    const module = await prisma.module.create({
      data: {
        courseId,
        order,
        translations: {
          create: [
            { language: Language.ES, title: titleEs, description: descriptionEs },
            { language: Language.EN, title: titleEn, description: descriptionEn }
          ]
        }
      }
    });

    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true, id: module.id };
  } catch (error) {
    console.error("Failed to create module:", error);
    return { success: false, error: "Failed to create module" };
  }
}

export async function updateModule(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

  const moduleId = formData.get("moduleId") as string;
  const courseId = formData.get("courseId") as string;
  const order = parseInt(formData.get("order") as string);
  const titleEs = formData.get("title_es") as string;
  const descriptionEs = formData.get("description_es") as string;
  const titleEn = formData.get("title_en") as string;
  const descriptionEn = formData.get("description_en") as string;

  try {
    await prisma.module.update({
      where: { id: moduleId },
      data: {
        order,
        translations: {
          deleteMany: {},
          create: [
            { language: Language.ES, title: titleEs, description: descriptionEs },
            { language: Language.EN, title: titleEn, description: descriptionEn }
          ]
        }
      }
    });

    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update module:", error);
    return { success: false, error: "Failed to update module" };
  }
}

export async function deleteModule(moduleId: string, courseId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

  try {
    await prisma.module.delete({
      where: { id: moduleId }
    });

    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete module:", error);
    return { success: false, error: "Failed to delete module" };
  }
}

export async function bulkCreateTopics(moduleId: string, courseId: string, topicsJson: string) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

  try {
    const topicsData = JSON.parse(topicsJson);

    // Use a transaction to ensure all topics are created or none
    // We increase the timeout to 30s to allow for large bulk operations
    await prisma.$transaction(async (tx) => {
      // First, delete existing topics for this module to perform a full sync
      await tx.topic.deleteMany({
        where: { moduleId }
      });

      // Then create the new ones
      for (const topic of topicsData) {
        await tx.topic.create({
          data: {
            moduleId,
            order: topic.order,
            translations: {
              create: topic.translations.map((t: any) => ({
                language: t.language as Language,
                title: t.title,
                content: t.content,
                videoUrl: t.videoUrl
              }))
            }
          }
        });
      }
    }, {
      timeout: 50000 // 50 segundos para operaciones grandes
    });

    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to bulk create topics:", error);
    return { success: false, error: "Invalid JSON format or database error" };
  }
}
