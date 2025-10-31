"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getFirebaseApp, getFirebaseDb } from "@/lib/firebaseClient";
import { doc, updateDoc } from "firebase/firestore";

function ProSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Procesando...");

  useEffect(() => {
    const uid = searchParams.get("uid");
    if (!uid) {
      setStatus("Error: falta el UID del usuario.");
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setStatus("Error: Firebase no disponible.");
      return;
    }
    updateDoc(doc(db, "users", uid), { isPro: true })
      .then(() => setStatus("¡Listo! Sos Pro 🎵"))
      .catch(() => setStatus("Error al actualizar tu plan. Contactanos."));
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center text-zinc-100">
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="text-3xl font-semibold mb-2">{status}</h1>
        <p>Volvé a la <a href="/" className="underline text-[var(--sm-yellow)]">página principal</a> y empezá a descubrir sin límites.</p>
      </div>
    </div>
  );
}

export default function ProSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-zinc-100">
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="text-3xl font-semibold mb-2">Cargando...</h1>
        </div>
      </div>
    }>
      <ProSuccessContent />
    </Suspense>
  );
}


