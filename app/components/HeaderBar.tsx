"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function HeaderBar() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!mounted) return;
      setEmail(user?.email ?? null);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);
  return (
    <header className="w-full flex items-center justify-end p-3 text-zinc-200">
      {email ? (
        <div className="flex items-center gap-3">
          <span className="text-sm">{email}</span>
          <button
            className="rounded-lg border border-white/15 px-3 py-1 hover:bg-white/5"
            onClick={async () => {
              await signOut(auth);
              location.href = "/";
            }}
          >
            Salir
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="rounded-lg px-3 py-1.5 border border-white/15 text-zinc-100 hover:bg-white/5 shadow-sm"
          >
            Ingresar
          </a>
          <a
            href="/register"
            className="rounded-lg px-3 py-1.5 bg-[var(--sm-red)] text-white hover:brightness-110 shadow-md"
          >
            Registrarse
          </a>
        </div>
      )}
    </header>
  );
}


