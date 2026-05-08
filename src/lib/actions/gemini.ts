"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

  // Usamos el modelo solicitado por el usuario
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `
    Actúa como un experto en educación tecnológica. Genera el contenido de un tema para un curso online.
    
    TÍTULO (ES): ${titleEs}
    TÍTULO (EN): ${titleEn}
    CONTEXTO ADICIONAL: ${extraContext}

    REQUISITOS:
    1. Genera contenido educativo de alta calidad en formato Markdown para ambos idiomas.
    2. El contenido debe incluir: explicaciones claras, ejemplos de código (si aplica) y puntos clave.
    
    ESTRUCTURA DE RESPUESTA:
    Escribe primero el contenido en ESPAÑOL.
    Luego escribe exactamente la marca: ===NEXT_LANGUAGE===
    Luego escribe el contenido en INGLÉS.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const parts = text.split("===NEXT_LANGUAGE===");
    const contentEs = parts[0]?.trim() || "# " + titleEs;
    const contentEn = parts[1]?.trim() || "# " + titleEn;

    const generatedData = {
      order: order,
      translations: [
        {
          language: "ES",
          title: titleEs,
          content: contentEs,
          videoUrl: null
        },
        {
          language: "EN",
          title: titleEn,
          content: contentEn,
          videoUrl: null
        }
      ]
    };

    return { success: true, data: generatedData };
  } catch (error: any) {
    console.error("Gemini generation error:", error);

    // Error 429: Too Many Requests / Quota Exceeded
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
      return {
        success: false,
        error: "Has agotado la cuota gratuita de Gemini para este modelo hoy. Inténtalo de nuevo más tarde o verifica tu cuota en Google AI Studio."
      };
    }

    return { success: false, error: "Error al generar contenido con Gemini. Verifica tu conexión y API Key." };
  }
}

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

  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `
    Actúa como un experto en diseño instruccional y educación tecnológica. 
    Tu tarea es diseñar la estructura completa de temas para un módulo de un curso online.
    
    DESCRIPCIÓN/OBJETIVO DEL MÓDULO: ${moduleDescription}
    CANTIDAD DE TEMAS SOLICITADOS: ${topicCount}
    TEMAS SUGERIDOS POR EL USUARIO (INCLUIR SI EXISTEN): ${suggestedTopics}
    ORDEN INICIAL: ${startOrder}

    REQUISITOS:
    1. Genera exactamente ${topicCount} temas.
    2. Si el usuario sugirió temas, inclúyelos en la secuencia lógica donde mejor encajen.
    3. Para cada tema, genera un título profesional en ESPAÑOL y otro en INGLÉS.
    4. Para cada tema, genera una breve introducción (1-2 párrafos) en Markdown para ambos idiomas.
    5. El resultado debe seguir exactamente esta estructura de texto para que yo pueda procesarlo:
    
    TEMA [Número]
    TITULO_ES: [Título en español]
    TITULO_EN: [Título en inglés]
    CONTENIDO_ES: [Contenido breve en español]
    CONTENIDO_EN: [Contenido breve en inglés]
    ===NEXT_TOPIC===
    [Siguiente Tema]
    ...etc
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const topicBlocks = text.split("===NEXT_TOPIC===").filter(block => block.trim().length > 10);
    const topics = topicBlocks.map((block, index) => {
      const lines = block.split("\n");
      const titleEs = lines.find(l => l.includes("TITULO_ES:"))?.split("TITULO_ES:")[1]?.trim() || "Nuevo Tema";
      const titleEn = lines.find(l => l.includes("TITULO_EN:"))?.split("TITULO_EN:")[1]?.trim() || "New Topic";
      
      // Extraer contenidos (pueden ser multilínea hasta que empiece el siguiente campo)
      const contentEsMatch = block.match(/CONTENIDO_ES:([\s\S]*?)CONTENIDO_EN:/);
      const contentEnMatch = block.match(/CONTENIDO_EN:([\s\S]*)/);
      
      const contentEs = contentEsMatch ? contentEsMatch[1].trim() : "# " + titleEs;
      const contentEn = contentEnMatch ? contentEnMatch[1].trim() : "# " + titleEn;

      return {
        order: startOrder + index,
        translations: [
          { language: "ES", title: titleEs, content: contentEs, videoUrl: null },
          { language: "EN", title: titleEn, content: contentEn, videoUrl: null }
        ]
      };
    });

    return { success: true, data: topics };
  } catch (error: any) {
    console.error("Gemini bulk generation error:", error);
    return { success: false, error: "Error al generar temas con Gemini" };
  }
}
