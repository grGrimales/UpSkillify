"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Usamos la configuración exacta que el usuario validó como funcional
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

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
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `
    Actúa como un experto en educación tecnológica. Genera el contenido detallado de un tema para un curso online.
    
    TÍTULO (ES): ${titleEs}
    TÍTULO (EN): ${titleEn}
    CONTEXTO ADICIONAL: ${extraContext}

    REQUISITOS:
    1. Genera contenido educativo de alta calidad en formato Markdown para AMBOS idiomas.
    2. NO incluyas el título del tema (ni como H1, ni en ninguna otra forma) dentro del contenido Markdown, ya que el título se maneja por separado. Empieza directamente con la explicación.
    3. El contenido debe incluir: explicaciones claras, ejemplos de código y puntos clave.
    4. Es obligatorio generar el contenido en los dos idiomas.
    
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

    const cleanContent = (raw: string, fallbackTitle: string) => {
      let content = raw.replace(/CONTENIDO_(ES|EN):/i, "").trim();
      // Eliminar un posible H1 inicial si el modelo lo incluyó a pesar de la instrucción
      content = content.replace(/^#\s+.*(\n|$)/, "").trim();
      return content || "Contenido para " + fallbackTitle;
    };

    const contentEs = cleanContent(parts[0] || "", titleEs);
    const contentEn = cleanContent(parts[1] || "", titleEn);

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

  // Configuración validada: GEMINI_MODEL en v1beta
  const model = genAI.getGenerativeModel(
    { model: GEMINI_MODEL },
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
    3. NO incluyas el título del tema (ni como H1) dentro de los campos CONTENIDO_ES o CONTENIDO_EN.
    4. El resultado debe seguir esta estructura exacta para cada tema:
    
    ===TOPIC_START===
    ORDEN: [Número]
    TITULO_ES: [Título en español]
    TITULO_EN: [Título en inglés]
    CONTENIDO_ES: [Un párrafo de introducción en español, sin repetir el título]
    CONTENIDO_EN: [Un párrafo de introducción en inglés, sin repetir el título]
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

      const cleanField = (content: string, fallback: string) => {
        // Eliminar H1 si el modelo lo incluyó
        const cleaned = content.replace(/^#\s+.*(\n|$)/, "").trim();
        return cleaned || fallback;
      };

      const orderVal = parseInt(getField("ORDEN")) || startOrder;
      const titleEs = getField("TITULO_ES") || "Nuevo Tema";
      const titleEn = getField("TITULO_EN") || "New Topic";
      const contentEs = cleanField(getField("CONTENIDO_ES"), titleEs);
      const contentEn = cleanField(getField("CONTENIDO_EN"), titleEn);

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

  // Configuración validada: GEMINI_MODEL en v1beta
  const model = genAI.getGenerativeModel(
    { model: GEMINI_MODEL },
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

/**
 * Genera preguntas de examen basadas en el contenido de los temas seleccionados
 */
export async function generateExamQuestions(
  topicContentsEn: string[],
  questionCount: number = 5,
  extraInstructions: string = ""
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: "GEMINI_API_KEY no configurada en el servidor" };
  }

  // Configuración validada: GEMINI_MODEL en v1beta
  const model = genAI.getGenerativeModel(
    { model: GEMINI_MODEL },
    { apiVersion: "v1beta" }
  );

  const combinedContent = topicContentsEn.join("\n\n---\n\n");

  const prompt = `
    Actúa como un experto en evaluación educativa. Genera un examen de alta calidad basado EN EL CONTENIDO PROPORCIONADO.
    
    CONTENIDO DE REFERENCIA (EN INGLÉS):
    ${combinedContent}

    CANTIDAD DE PREGUNTAS: ${questionCount}
    INSTRUCCIONES ADICIONALES: ${extraInstructions}

    REQUISITOS:
    1. Genera exactamente ${questionCount} preguntas.
    2. CADA PREGUNTA debe estar en ESPAÑOL e INGLÉS.
    3. Cada pregunta debe tener exactamente 4 opciones.
    4. El resultado debe ser un JSON válido que siga esta estructura:
    
    [
      {
        "questionEn": "Question text in English",
        "questionEs": "Texto de la pregunta en español",
        "optionsEn": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "optionsEs": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
        "correctOption": 0, // Índice de la opción correcta (0-3)
        "explanationEn": "Explanation of why this is the correct answer in English",
        "explanationEs": "Explicación de por qué esta es la respuesta correcta en español"
      }
    ]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extraer el JSON de la respuesta (por si el modelo incluye markdown \`\`\`json)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    
    const questions = JSON.parse(jsonStr);

    return { success: true, data: questions };
  } catch (error: any) {
    console.error("Gemini exam generation error:", error);
    return { success: false, error: "Error al generar el examen con Gemini." };
  }
}

