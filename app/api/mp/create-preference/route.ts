import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "Missing MP_ACCESS_TOKEN" }, { status: 500 });
    }

    const origin = (() => {
      try {
        return new URL(req.url).origin;
      } catch {
        return "";
      }
    })();
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const host = req.headers.get("host") ?? "";
    const baseFromReq = host ? `${proto}://${host}` : origin;
    const base = (process.env.NEXT_PUBLIC_APP_URL || baseFromReq || origin || "").replace(/\/$/, "");
    const success = `${base}/pro/success`;
    const failure = `${base}/`;
    const notificationUrl = `${base}/api/mp/webhook`;

    const body = {
      items: [
        {
          title: "SoundMatch PRO (lifetime)",
          quantity: 1,
          currency_id: "USD",
          unit_price: 1.99,
        },
      ],
      payer: email ? { email } : undefined,
      back_urls: { success, failure, pending: failure },
      auto_return: "approved",
      notification_url: notificationUrl,
    };

    if (!success) {
      return NextResponse.json({ error: "config_error", details: "Missing success URL for Mercado Pago" }, { status: 500 });
    }

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: "mp_error", details: txt }, { status: 500 });
    }

    const pref = await res.json();
    const url = pref.init_point || pref.sandbox_init_point;
    return NextResponse.json({ url });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "server_error" }, { status: 500 });
  }
}


