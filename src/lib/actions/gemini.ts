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

    if (error.status === 429) {
      const retryDetail = error.errorDetails?.find(
        (d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
      );
      const retryIn = retryDetail?.retryDelay
        ? ` Reintenta en ${retryDetail.retryDelay}.`
        : "";
      return {
        success: false,
        error: `Cuota de Gemini agotada.${retryIn} Si el problema persiste, verifica tu plan en https://aistudio.google.com/`
      };
    }

    return { success: false, error: "Error al generar contenido con Gemini. Verifica tu conexión y API Key." };
  }
}
