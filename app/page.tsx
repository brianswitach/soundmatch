"use client";

import { useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { Disc3, Music2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const { messages, sendMessage, status, setMessages, stop } = useChat();
  const [input, setInput] = useState("");
  const isLoading = status === "submitted" || status === "streaming";
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (user) => setUserEmail(user?.email ?? null));
    return () => unsub();
  }, []);

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "assistant") {
        // Concatenate text parts from the assistant message
        const text = messages[i].parts
          .filter((p: any) => p?.type === "text")
          .map((p: any) => p.text as string)
          .join("");
        return text;
      }
    }
    return "";
  }, [messages]);

  type Rec = { title: string; artist: string; reason: string };

  const recommendations = useMemo((): Rec[] => {
    if (!lastAssistant) return [];
    // Try JSON first
    try {
      const jsonStart = lastAssistant.indexOf("[");
      const jsonEnd = lastAssistant.lastIndexOf("]");
      const payload = jsonStart >= 0 && jsonEnd > jsonStart
        ? lastAssistant.slice(jsonStart, jsonEnd + 1)
        : lastAssistant;
      const parsed = JSON.parse(payload);
      if (Array.isArray(parsed)) {
        return parsed
          .slice(0, 5)
          .map((x: any) => ({
            title: String(x.title ?? "").replace(/[*"']/g, "").trim(),
            artist: String(x.artist ?? "").replace(/[*"']/g, "").trim(),
            reason: String(x.reason ?? "").replace(/[*"']/g, "").trim(),
          }))
          .filter((r: Rec) => r.title && r.artist);
      }
    } catch {}

    // Fallback naive parse
    const lines = lastAssistant
      .split(/\n|,/g)
      .map((l: string) => l.replace(/[*"']/g, "").trim())
      .filter(Boolean);
    const items: Rec[] = [];
    for (const line of lines) {
      if (/^[-•\d]/.test(line)) {
        const clean = line.replace(/^[-•\d\.\)\s]+/, "");
        const [maybeSong, ...rest] = clean.split(" - ");
        const [title, artist] = maybeSong.includes(" de ")
          ? maybeSong.split(" de ")
          : [maybeSong, rest.join(" - ")];
        items.push({
          title: (title ?? "").trim(),
          artist: (artist ?? "").trim(),
          reason: rest.join(" - ").trim(),
        });
      }
    }
    return items.slice(0, 5);
  }, [lastAssistant]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <main className="w-full max-w-3xl py-16">
        {/* Hero */}
        <section className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 justify-center mb-3">
            <Disc3 className="h-8 w-8 text-[var(--sm-yellow)] animate-spin-slow" />
            <h1 className="text-5xl tracking-tight inline-flex items-center gap-2 neon-title font-display">
              <Music2 className="h-6 w-6 text-[var(--sm-red)]" />
              SoundMatch AI
          </h1>
          </div>
          <p
            className="mx-auto max-w-2xl text-gradient-primary animate-gradient-x font-light"
          >
            Descubrí música nueva basada en lo que te gusta 🎧
          </p>
          <div className="mt-5 flex justify-center">
            <div className="neon-bars" aria-hidden="true">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="neon-bar" />
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 20 }}
              onClick={() => {
                document.getElementById("songs")?.focus();
              }}
              className="inline-flex items-center gap-2 rounded-xl btn-accent text-white px-6 py-3 shadow-md hover:shadow-lg"
            >
              <Sparkles className="h-5 w-5" />
              Empezar
            </motion.button>
            <button
              onClick={async () => {
                // Redirige a Mercado Pago sin pedir email
                const res = await fetch("/api/mp/create-preference", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: userEmail ?? undefined }),
                });
                const data = await res.json();
                if (data.url) router.push(data.url);
              }}
              className="ml-3 rounded-xl px-4 py-3 border border-white/15 text-zinc-100 hover:bg-white/5"
            >
              Hacete PRO
            </button>
            <div className="mt-2 text-xs text-zinc-400">Plan gratis</div>
        </div>
        </section>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = input.trim();
            if (!text) return;
            // Free gating: guests get 2 usos
            try {
              if (!userEmail) {
                const used = Number(localStorage.getItem("sm_uses") || "0");
                if (used >= 2) {
                  setShowPaywall(true);
                  return;
                }
                localStorage.setItem("sm_uses", String(used + 1));
              }
            } catch {}
            // Empezar una "conversación" nueva por cada búsqueda
            // Detenemos cualquier stream previo, limpiamos mensajes y enviamos el nuevo prompt
            stop?.();
            setMessages?.([]);
            sendMessage({ text });
            setInput("");
          }}
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-sm p-6 text-zinc-100"
        >
          <label htmlFor="songs" className="block text-sm font-medium text-zinc-200 mb-2">
            Escribí tus canciones favoritas (una por línea o separadas por comas)
          </label>
          <textarea
            id="songs"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej: Arctic Monkeys - Do I Wanna Know\nTame Impala - The Less I Know The Better\n..."
            rows={6}
            className="w-full resize-y rounded-lg border border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--sm-yellow)] focus:border-[var(--sm-yellow)] p-3"
          />

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex items-center justify-center rounded-lg btn-accent px-5 py-2.5 text-white hover:brightness-105 disabled:opacity-60 shadow-sm"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {isLoading ? "Procesando..." : "Descubrir nuevas canciones"}
            </button>

            {isLoading && (
              <div className="inline-flex items-center text-zinc-600">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-zinc-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Generando recomendaciones...
              </div>
            )}
          </div>
        </form>

        {recommendations.length > 0 && (
          <motion.section
            className="mt-10 grid gap-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {recommendations.map((rec: any, idx: number) => (
              <motion.article
                key={idx}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="rounded-xl border border-white/10 shadow-sm p-5 flex items-start gap-4 glow-card bg-white/5 text-zinc-100"
              >
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full disc-gradient" />
                  <div className="absolute inset-1 rounded-full bg-white" />
                  <div className="absolute inset-1.5 rounded-full border-2 border-zinc-200" />
                  <Disc3 className="absolute inset-0 m-auto h-6 w-6 text-zinc-700" />
                </div>
                <div>
                  <div className="font-semibold">
                    <span className="mr-2">#{idx + 1}</span>
                    {rec.title} — <span className="text-zinc-600">{rec.artist}</span>
                  </div>
                  {rec.reason && (
                    <p className="text-sm text-zinc-300 mt-1">{rec.reason}</p>
                  )}
                </div>
              </motion.article>
            ))}
          </motion.section>
        )}

        {showPaywall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowPaywall(false)} />
            <div className="relative max-w-lg w-full rounded-2xl border border-white/15 bg-gradient-to-br from-[var(--sm-navy)] to-[var(--sm-charcoal)] p-6 text-zinc-100 shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Disc3 className="h-6 w-6 text-[var(--sm-yellow)]" />
                <h3 className="text-2xl font-bold">Usos gratuitos agotados</h3>
              </div>
              <p className="text-zinc-300 mb-4">
                Ya utilizaste tus 2 intentos gratuitos (máx. 300 tokens por respuesta). Desbloqueá
                acceso ilimitado y respuestas más extensas con el plan <span className="font-semibold">PRO</span>.
              </p>
              <div className="rounded-xl p-4 mb-4 bg-white/5 border border-white/10">
                <p className="text-xl font-semibold text-white">PRO • Lifetime</p>
                <p className="text-3xl font-extrabold text-[var(--sm-yellow)]">US$ 1.99</p>
                <ul className="mt-2 text-sm text-zinc-300 list-disc ml-5">
                  <li>Respuestas sin límite</li>
                  <li>Mejor calidad y menos cortes</li>
                  <li>Soporte prioritario</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 rounded-xl bg-[var(--sm-red)] hover:brightness-110 text-white py-3 text-lg font-semibold shadow-lg"
                  onClick={async () => {
                    const email = userEmail || prompt("Ingresá tu email para continuar") || "";
                    if (!email) return;
                    const res = await fetch("/api/mp/create-preference", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email }),
                    });
                    const data = await res.json();
                    if (data.url) location.href = data.url;
                  }}
                >
                  Comprar PRO
                </button>
                <button
                  className="flex-1 rounded-xl border border-white/20 hover:bg-white/5 py-3 text-lg"
                  onClick={() => setShowPaywall(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
        </div>
        )}

        {/* Se removieron Logs y Paleta para una UI más limpia */}
      </main>
    </div>
  );
}
