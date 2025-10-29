import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2024-06-20",
    });

    const price = process.env.STRIPE_PRICE_ID as string; // monthly $2.99 price id
    if (!price) {
      return NextResponse.json({ error: "Missing STRIPE_PRICE_ID" }, { status: 500 });
    }

    // Create or get customer by email
    let customerId: string | undefined;
    if (email) {
      const existing = await stripe.customers.search({
        query: `email:'${email}'`,
      });
      customerId = existing.data[0]?.id;
    }
    const customer = customerId
      ? await stripe.customers.retrieve(customerId)
      : await stripe.customers.create({ email });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: (customer as any).id,
      line_items: [{ price, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pro/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "stripe_error" }, { status: 500 });
  }
}


