# TikkaXpress

Dedicated Next.js storefront for TikkaXpress Indian Kitchen with pickup/delivery ordering, cart pricing, Stripe Checkout integration, and an admin dashboard concept.

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Ordering uses PostgreSQL through Prisma. Configure `DATABASE_URL`, run migrations, and seed the menu before testing checkout:

```bash
npm run prisma:migrate
npm run db:seed
```

If `STRIPE_SECRET_KEY` is empty, checkout creates a pending database order and returns a local demo confirmation. Real orders are marked `paid` only by the Stripe webhook.

## Production Notes

- Configure `DATABASE_URL` for PostgreSQL.
- Run `npm run prisma:migrate` once database credentials are ready.
- Run `npm run db:seed` to load TikkaXpress categories, menu items, modifiers, and image paths.
- Configure Stripe webhook endpoint at `/api/stripe/webhook`.
- Configure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`.
- Configure tax, delivery, minimum order, hours, and maps values in `.env.local`.
- Keep `prisma/menu-seed.json` as the seed source for menu updates, then rerun `npm run db:seed`.
- Store locations are defined in `lib/restaurant.ts` and seeded through `prisma/menu-seed.json`; rerun `npm run prisma:migrate` and `npm run db:seed` after adding or editing locations.
