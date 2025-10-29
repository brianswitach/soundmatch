# SoundMatch AI

Descubrí música nueva basada en lo que te gusta.

Stack: Next.js (App Router), TypeScript, TailwindCSS, Vercel AI SDK, OpenRouter, Stripe.

## Desarrollo local

```bash
npm run dev
```

## Variables de entorno
Configuralas en Vercel (Project → Settings → Environment Variables):

- `NEXT_PUBLIC_APP_URL` → URL pública
- `OPENAI_BASE_URL` → `https://openrouter.ai/api/v1`
- `OPENAI_API_KEY` → tu key de OpenRouter
- `STRIPE_SECRET_KEY` → secret de Stripe
- `STRIPE_PRICE_ID` → price mensual (USD 2.99)

## Deploy
- Importá este repo en Vercel y definí las variables.
- Stripe Checkout ya está integrado en `/api/checkout`.


Note: Become Pro redirects to Mercado Pago via /api/mp/create-preference.
