import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

  const { messages } = await req.json();

  // Try to capture the user's latest input text to discourage same-artist recs
  let userInputText = "";
  try {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (msg?.role === "user" && Array.isArray(msg?.parts)) {
        userInputText = msg.parts
          .filter((p: any) => p?.type === "text")
          .map((p: any) => String(p.text ?? ""))
          .join("\n")
          .slice(0, 1200);
        break;
      }
    }
  } catch (_) {}

  const systemPrompt = [
    "Sos un experto en música y recomendador.",
    "Objetivo: analizar la lista de temas del usuario, inferir QUÉ TIENEN EN COMÚN (mood, energía/tempo, tonalidad aproximada, temática lírica, subgénero, época/región, producción), y recomendar 5 canciones NUEVAS alineadas a esos rasgos.",
    "Reglas de recomendación:",
    "- Evitá repetir artistas presentes en la entrada.",
    "- Priorizá similitud real por rasgos (no solo por género).",
    "- Usá EXCLUSIVAMENTE las canciones provistas por el usuario como base del análisis. No inventes ejemplos.",
    userInputText
      ? `- IMPORTANTE: No recomiendes canciones de artistas mencionados literal en la entrada del usuario. Texto del usuario para detectar artistas a evitar: "${userInputText.replace(/"/g, '\\"')}"`
      : "",
    "Formato de salida: JSON ESTRICTO, un array de 5 objetos: [{\"title\": string, \"artist\": string, \"reason\": string}] SIN texto extra.",
  ].join("\n");

  const modelId = "deepseek/deepseek-chat-v3.1:free";

  const result = await streamText({
    model: openai(modelId),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    maxRetries: 0,
    responseFormat: "json",
  });

  return result.toUIMessageStreamResponse({ headers: { "x-model-used": modelId } });
}
