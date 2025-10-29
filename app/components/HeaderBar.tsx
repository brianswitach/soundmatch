"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function HeaderBar() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);
  return (
    <header className="w-full flex items-center justify-end p-3 text-zinc-200">
      {email ? (
        <div className="flex items-center gap-3">
          <span className="text-sm">{email}</span>
          <button
            className="rounded-lg border border-white/15 px-3 py-1 hover:bg-white/5"
            onClick={async () => {
              await supabase.auth.signOut();
              location.href = "/";
            }}
          >
            Salir
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <a className="underline" href="/login">Ingresar</a>
          <a className="underline" href="/register">Registrarse</a>
        </div>
      )}
    </header>
  );
}


