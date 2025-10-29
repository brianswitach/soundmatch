"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
    });
  }, [supabase, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      // La mayoría de los proyectos requieren confirmación de email
      router.push("/login");
    } catch (err: any) {
      console.error("register error", err);
      setError(err?.message ?? "Ocurrió un error al registrarte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-zinc-100">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
      >
        <h1 className="text-2xl font-semibold mb-4">Crear cuenta</h1>
        <label className="text-sm">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 mb-3 w-full rounded-lg border border-white/15 bg-white/5 p-3"
        />
        <label className="text-sm">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 mb-4 w-full rounded-lg border border-white/15 bg-white/5 p-3"
        />
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg btn-accent py-2 text-white"
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
        <p className="text-sm mt-3">
          ¿Ya tenés cuenta? <a href="/login" className="underline">Ingresá</a>
        </p>
      </form>
    </div>
  );
}


