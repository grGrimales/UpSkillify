"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Language } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createCourse(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;
  const published = formData.get("published") === "on";

  // Get translations
  const titleEs = formData.get("title_es") as string;
  const descriptionEs = formData.get("description_es") as string;
  const titleEn = formData.get("title_en") as string;
  const descriptionEn = formData.get("description_en") as string;

  try {
    const course = await prisma.course.create({
      data: {
        slug,
        published,
        translations: {
          create: [
            {
              language: Language.ES,
              title: titleEs,
              description: descriptionEs,
            },
            {
              language: Language.EN,
              title: titleEn,
              description: descriptionEn,
            }
          ]
        }
      }
    });

    revalidatePath("/admin/courses");
    revalidatePath("/");
    
    return { success: true, id: course.id };
  } catch (error) {
    console.error("Failed to create course:", error);
    return { success: false, error: "Failed to create course. Slug might already exist." };
  }
}

export async function toggleCourseStatus(courseId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { published: true }
    });

    if (!course) throw new Error("Course not found");

    await prisma.course.update({
      where: { id: courseId },
      data: { published: !course.published }
    });

    revalidatePath("/admin/courses");
    revalidatePath("/");
    revalidatePath(`/admin/courses/${courseId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle course status:", error);
    return { success: false, error: "Failed to toggle status" };
  }
}
