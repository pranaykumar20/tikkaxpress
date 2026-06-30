# TikkaXpress

Dedicated Next.js storefront for TikkaXpress Indian Kitchen with pickup/delivery ordering, cart pricing, Toast Payments, Toast POS order submission, and an admin dashboard.

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3003`.

Ordering uses PostgreSQL through Prisma. Configure `DATABASE_URL`, run migrations, and seed the menu before testing checkout:

```bash
npm run prisma:migrate
npm run db:seed
```

If Toast credentials are empty, checkout runs in **demo mode**: Toast payment is simulated locally and orders are stored with demo Toast POS references. Configure Toast credentials to sync menu data, collect live payments, and submit orders to your restaurant POS.

## Toast Integration

1. Request **Custom Integration** API access from your Toast account representative.
2. Configure Toast env vars in `.env.local` (see `.env.example`).
3. In Toast Web, create pickup/delivery dining options and a website revenue center; copy their GUIDs into env.
4. Run menu sync from **Admin → Sync menu from Toast** or `POST /api/admin/toast/sync-menu`.
5. Configure webhooks in Toast:
   - Payments: `/api/webhooks/toast/payments`
   - Order status: `/api/webhooks/toast/orders`

## Production Notes

- Configure `DATABASE_URL` for PostgreSQL.
- Run `npm run prisma:migrate` once database credentials are ready.
- Run `npm run db:seed` to load TikkaXpress categories, menu items, modifiers, and image paths.
- Configure Toast API, payments, dining option GUIDs, and webhook secret.
- Configure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`.
- Configure tax, delivery, minimum order, hours, and maps values in `.env.local`.
- Keep `prisma/menu-seed.json` as the bootstrap seed source; live menu updates should come from Toast sync after credentials are configured.
- Store locations are defined in `lib/restaurant.ts` and seeded through `prisma/menu-seed.json`.
