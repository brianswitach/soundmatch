"use client";

import { useEffect } from "react";

export default function ProSuccess() {
  useEffect(() => {
    // Lightweight: mark as pro on the client; webhook should also upgrade in DB
    document.cookie = `sm_plan=pro; path=/; max-age=${60 * 60 * 24 * 365}`;
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center text-zinc-100">
      <div className="rounded-xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-semibold mb-2">¡Listo! Sos Pro 🎵</h1>
        <p>Volvé a la página principal y empezá a descubrir sin límites.</p>
      </div>
    </div>
  );
}


