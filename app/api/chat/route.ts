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
    "Objetivo: dado el/los temas que provee el usuario, inferí QUÉ TIENEN EN COMÚN (mood, energía/tempo, bpm aproximado, tonalidad estimada, temática lírica, subgénero, época/región, rasgos de producción) y recomendá 5 canciones NUEVAS con alta probabilidad de gustarle.",
    "Proceso estricto:",
    "1) EXTRAÉ las canciones del input (una por línea o separadas por comas). Para cada una: {title, artist}.",
    "2) Calculá rasgos en común: mood, energía/bpm aprox., tonalidad estimada, subgénero, época/región, timbres/producción.",
    "3) Buscá 5 canciones NUEVAS que compartan esos rasgos.",
    "4) No repitas artistas presentes en la entrada del usuario.",
    "5) Evitá recomendar el mismo tema o remixes triviales del mismo artista.",
    "6) Por cada recomendación, explicá brevemente por qué coincide con los rasgos comunes.",
    "Reglas:",
    "- Priorizá similitud real por rasgos (no solo por género).",
    "- Usá EXCLUSIVAMENTE las canciones provistas por el usuario como base del análisis. No inventes canciones de entrada.",
    userInputText
      ? `- IMPORTANTE: No recomiendes canciones de artistas mencionados literal en la entrada del usuario. Texto del usuario: \"${userInputText.replace(/"/g, '\\"')}\".`
      : "",
    "Formato de salida (JSON estricto): [ { \"title\": string, \"artist\": string, \"reason\": string } ] sin texto adicional.",
  ].join("\n");

  const modelId = "deepseek/deepseek-chat-v3.1:free";

  const result = await streamText({
    model: openai(modelId),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    maxRetries: 0,
    maxOutputTokens: 300,
  });

  return result.toUIMessageStreamResponse({ headers: { "x-model-used": modelId } });
}
