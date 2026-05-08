"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Usamos la configuración exacta que el usuario validó como funcional
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Genera el contenido detallado de un tema individual
 */
export async function generateTopicContent(
  titleEs: string,
  titleEn: string,
  extraContext: string,
  order: number
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "GEMINI_API_KEY no configurada en el servidor" };
  }
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `
    Actúa como un experto en educación tecnológica. Genera el contenido detallado de un tema para un curso online.
    
    TÍTULO (ES): ${titleEs}
    TÍTULO (EN): ${titleEn}
    CONTEXTO ADICIONAL: ${extraContext}

    REQUISITOS:
    1. Genera contenido educativo de alta calidad en formato Markdown para AMBOS idiomas.
    2. El contenido debe incluir: explicaciones claras, ejemplos de código y puntos clave.
    3. Es obligatorio generar el contenido en los dos idiomas.
    
    ESTRUCTURA DE RESPUESTA (SIGUE ESTO ESTRICTAMENTE):
    CONTENIDO_ES:
    [Aquí todo el contenido en español]
    
    ===NEXT_LANGUAGE===
    
    CONTENIDO_EN:
    [Aquí todo el contenido en inglés]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const parts = text.split("===NEXT_LANGUAGE===");

    let contentEs = parts[0]?.replace(/CONTENIDO_ES:/i, "").trim() || "# " + titleEs;
    let contentEn = parts[1]?.replace(/CONTENIDO_EN:/i, "").trim() || "# " + titleEn;

    const generatedData = {
      order: order,
      translations: [
        { language: "ES", title: titleEs, content: contentEs, videoUrl: null },
        { language: "EN", title: titleEn, content: contentEn, videoUrl: null }
      ]
    };

    return { success: true, data: generatedData };
  } catch (error: any) {
    console.error("Gemini generation error:", error);
    return { success: false, error: "Error al generar contenido con Gemini." };
  }
}

/**
 * Genera múltiples temas para un módulo específico
 */
export async function generateModuleTopics(
  moduleDescription: string,
  topicCount: number = 5,
  suggestedTopics: string = "",
  startOrder: number = 1
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "GEMINI_API_KEY no configurada en el servidor" };
  }

  // Configuración validada: gemini-flash-latest en v1beta
  const model = genAI.getGenerativeModel(
    { model: "gemini-flash-latest" },
    { apiVersion: "v1beta" }
  );

  const prompt = `
    Actúa como un experto en diseño instruccional. Diseña la estructura de temas para un módulo.
    
    DESCRIPCIÓN: ${moduleDescription}
    CANTIDAD: ${topicCount} temas
    SUGERENCIAS: ${suggestedTopics}
    ORDEN INICIAL: ${startOrder}

    REQUISITOS OBLIGATORIOS:
    1. Genera exactamente ${topicCount} temas.
    2. CADA TEMA debe tener título y contenido en ESPAÑOL e INGLÉS. No omitas el inglés.
    3. El resultado debe seguir esta estructura exacta para cada tema:
    
    ===TOPIC_START===
    ORDEN: [Número]
    TITULO_ES: [Título en español]
    TITULO_EN: [Título en inglés]
    CONTENIDO_ES: [Un párrafo de introducción en español]
    CONTENIDO_EN: [Un párrafo de introducción en inglés]
    ===TOPIC_END===
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const topicBlocks = text.split("===TOPIC_START===").filter(b => b.includes("TITULO_ES:"));

    const topics = topicBlocks.map((block) => {
      const getField = (label: string) => {
        const regex = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|===|$)`, "i");
        return block.match(regex)?.[1]?.trim() || "";
      };

      const orderVal = parseInt(getField("ORDEN")) || startOrder;
      const titleEs = getField("TITULO_ES") || "Nuevo Tema";
      const titleEn = getField("TITULO_EN") || "New Topic";
      const contentEs = getField("CONTENIDO_ES") || "# " + titleEs;
      const contentEn = getField("CONTENIDO_EN") || "# " + titleEn;

      return {
        order: orderVal,
        translations: [
          { language: "ES", title: titleEs, content: contentEs, videoUrl: null },
          { language: "EN", title: titleEn, content: contentEn, videoUrl: null }
        ]
      };
    });

    return { success: true, data: topics };
  } catch (error: any) {
    console.error("Gemini bulk generation error:", error);
    return { success: false, error: "Error al generar temas masivamente." };
  }
}

/**
 * Genera múltiples módulos para un curso
 */
export async function generateCourseModules(
  moduleListText: string,
  startOrder: number = 1
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "GEMINI_API_KEY no configurada en el servidor" };
  }

  // Configuración validada: gemini-flash-latest en v1beta
  const model = genAI.getGenerativeModel(
    { model: "gemini-flash-latest" },
    { apiVersion: "v1beta" }
  );

  const prompt = `
    Actúa como un experto en diseño curricular. Tu tarea es convertir una lista de nombres de módulos o una descripción en una estructura formal de módulos para un curso online.
    
    LISTA/DESCRIPCIÓN PROPORCIONADA: ${moduleListText}
    ORDEN INICIAL: ${startOrder}

    REQUISITOS:
    1. Para cada módulo identificado, genera un título profesional en ESPAÑOL y otro en INGLÉS.
    2. Para cada módulo, genera una descripción breve (1-2 párrafos) de los objetivos en ESPAÑOL e INGLÉS.
    3. El resultado debe seguir esta estructura exacta para cada módulo:
    
    ===MODULE_START===
    ORDEN: [Número]
    TITULO_ES: [Título en español]
    TITULO_EN: [Título en inglés]
    DESC_ES: [Descripción en español]
    DESC_EN: [Descripción en inglés]
    ===MODULE_END===
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const moduleBlocks = text.split("===MODULE_START===").filter(b => b.includes("TITULO_ES:"));

    const modules = moduleBlocks.map((block, index) => {
      const getField = (label: string) => {
        const regex = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|===|$)`, "i");
        return block.match(regex)?.[1]?.trim() || "";
      };

      return {
        order: startOrder + index,
        translations: [
          { language: "ES", title: getField("TITULO_ES") || "Nuevo Módulo", description: getField("DESC_ES") },
          { language: "EN", title: getField("TITULO_EN") || "New Module", description: getField("DESC_EN") }
        ]
      };
    });

    return { success: true, data: modules };
  } catch (error: any) {
    console.error("Gemini bulk module generation error:", error);
    return { success: false, error: "Error al generar módulos con Gemini" };
  }
}
