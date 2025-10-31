"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth, getFirebaseApp } from "@/lib/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function HeaderBar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  useEffect(() => {
    let mounted = true;
    const auth = getFirebaseAuth();
    if (!auth) return () => {};
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      if (user) {
        setUserName(user.displayName ?? user.email ?? null);
        const app = getFirebaseApp();
        if (app) {
          const db = getFirestore(app);
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            setIsPro(snap.data()?.isPro === true);
          }
        }
      } else {
        setUserName(null);
        setIsPro(false);
      }
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);
  return (
    <header className="w-full flex items-center justify-end p-3 text-zinc-200">
      {userName ? (
        <div className="flex items-center gap-3">
          <span className="text-sm">Bienvenido/a {userName}</span>
          {isPro && (
            <span className="text-xs bg-green-500/20 text-green-400 border border-green-400/30 px-2 py-0.5 rounded-full">
              PRO
            </span>
          )}
          <button
            className="rounded-lg border border-white/15 px-3 py-1 hover:bg-white/5"
            onClick={async () => {
              const auth = getFirebaseAuth();
              if (auth) await signOut(auth);
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


