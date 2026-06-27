import { redirect } from "next/navigation";
import { BarChart3, Clock, DollarSign, Flame, ToggleLeft, ToggleRight } from "lucide-react";
import { NewOrderAlert, PrintTicketsButton } from "@/components/AdminControls";
import { logoutAction, updateMenuItemAction, updateOrderStatusAction } from "@/app/admin/actions";
import { formatMoney, menuItems as seedMenuItems } from "@/lib/menu";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminDashboard, type OrderStatus } from "@/lib/orders";
import { hasDatabaseUrl } from "@/lib/prisma";
import { formatScheduledTime } from "@/lib/restaurant";

export const dynamic = "force-dynamic";

const orderStatuses: OrderStatus[] = ["new", "accepted", "preparing", "ready", "completed", "cancelled"];

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let dataError = "";
  let dashboard: Awaited<ReturnType<typeof getAdminDashboard>> = {
    orders: [],
    revenueCents: 0,
    averageTicketCents: 0,
    openOrders: 0,
    topItem: "Database unavailable",
    menuItems: seedMenuItems
  };
  try {
    dashboard = await getAdminDashboard();
  } catch (error) {
    dataError = error instanceof Error ? error.message : "Unable to load database dashboard.";
  }
  const newOrderCount = dashboard.orders.filter((order) => order.status === "new").length;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 rounded-[8px] border border-black/8 bg-white/72 p-5 shadow-card md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-ember">Restaurant dashboard</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">TikkaXpress Admin</h1>
            <p className="mt-2 text-sm font-semibold text-charcoal/55">Paid orders, kitchen status, menu availability, and sales at a glance.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <PrintTicketsButton />
            <form action={logoutAction}>
              <button className="inline-flex w-full items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 font-black text-ink shadow-card sm:w-auto">Sign out</button>
            </form>
          </div>
        </div>

        {!hasDatabaseUrl() && (
          <div className="mb-5 rounded-[8px] border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900">
            DATABASE_URL is not configured. Admin controls are visible, but live orders and menu edits require PostgreSQL plus `npm run prisma:migrate` and `npm run db:seed`.
          </div>
        )}
        {dataError && <div className="mb-5 rounded-[8px] bg-red-50 p-4 text-sm font-bold text-red-700">{dataError}</div>}
        <NewOrderAlert count={newOrderCount} />

        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={<DollarSign />} label="Today revenue" value={formatMoney(dashboard.revenueCents)} />
          <Metric icon={<Clock />} label="Open orders" value={String(dashboard.openOrders)} />
          <Metric icon={<Flame />} label="Top item" value={dashboard.topItem} />
          <Metric icon={<BarChart3 />} label="Avg ticket" value={formatMoney(dashboard.averageTicketCents)} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_460px]">
          <section className="rounded-[8px] bg-white p-6 shadow-card print:shadow-none">
            <h2 className="mb-5 text-2xl font-black">Paid orders</h2>
            <div className="space-y-3">
              {dashboard.orders.length === 0 && <div className="rounded-[8px] border border-dashed border-tandoori/35 bg-cream p-6 text-center font-bold text-charcoal/60">No paid orders yet.</div>}
              {dashboard.orders.map((order) => (
                <article key={order.id} className="rounded-[8px] border border-black/8 bg-cream/45 p-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                    <div className="min-w-0">
                      <div className="font-black">{order.id} · {order.customer.name}</div>
                      <div className="mt-1 text-sm font-semibold text-charcoal/55">
                        {order.location.shortName} · {order.fulfillmentType} · {formatScheduledTime(order.customer.scheduledTime)} · {order.customer.phone}
                      </div>
                      <div className="mt-1 text-xs font-bold text-charcoal/45">{order.location.address}</div>
                      <div className="mt-3 space-y-1 text-sm">
                        {order.items.map((item) => (
                          <div key={item.id} className="font-semibold text-charcoal/70">
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-lg font-black md:text-right">{formatMoney(order.totalCents)}</div>
                  </div>
                  <form action={updateOrderStatusAction} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input type="hidden" name="orderId" value={order.id} />
                    <select name="status" defaultValue={order.status} className="rounded-[8px] border border-black/10 bg-white px-3 py-2 font-bold capitalize outline-none focus:focus-ring">
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-[8px] bg-ink px-4 py-2 font-black text-white">Update status</button>
                    <span className="rounded-full bg-orange-100 px-3 py-2 text-xs font-black uppercase text-curry">{order.paymentStatus}</span>
                  </form>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[8px] bg-ink p-6 text-white shadow-card print:hidden">
            <h2 className="mb-5 text-2xl font-black">Menu controls</h2>
            <div className="max-h-[820px] space-y-4 overflow-y-auto pr-1">
              {dashboard.menuItems.map((item) => (
                <form key={item.id} action={updateMenuItemAction} className="rounded-[8px] border border-white/10 bg-white/8 p-4">
                  <input type="hidden" name="itemId" value={item.id} />
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate font-black">{item.name}</div>
                      <div className="text-sm text-white/55">{formatMoney(item.priceCents)}</div>
                    </div>
                    {item.active ? <ToggleRight className="h-7 w-7 shrink-0 text-tandoori" /> : <ToggleLeft className="h-7 w-7 shrink-0 text-white/35" />}
                  </div>
                  <div className="grid gap-3">
                    <label className="flex items-center gap-2 text-sm font-bold">
                      <input name="active" type="checkbox" defaultChecked={item.active} />
                      Available
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold">
                      <input name="featured" type="checkbox" defaultChecked={Boolean(item.featured)} />
                      Featured
                    </label>
                    <label className="block text-xs font-black uppercase tracking-[0.14em] text-white/50">
                      Price cents
                      <input name="priceCents" type="number" defaultValue={item.priceCents} className="mt-1 w-full rounded-[8px] border border-white/10 bg-white px-3 py-2 font-bold text-ink outline-none" />
                    </label>
                    <label className="block text-xs font-black uppercase tracking-[0.14em] text-white/50">
                      Spice level
                      <input name="spiceLevel" type="number" min={0} max={3} defaultValue={item.spiceLevel} className="mt-1 w-full rounded-[8px] border border-white/10 bg-white px-3 py-2 font-bold text-ink outline-none" />
                    </label>
                    <label className="block text-xs font-black uppercase tracking-[0.14em] text-white/50">
                      Tags
                      <input name="tags" defaultValue={item.tags.join(", ")} className="mt-1 w-full rounded-[8px] border border-white/10 bg-white px-3 py-2 font-bold text-ink outline-none" />
                    </label>
                    <label className="block text-xs font-black uppercase tracking-[0.14em] text-white/50">
                      Description
                      <textarea name="description" defaultValue={item.description} rows={3} className="mt-1 w-full rounded-[8px] border border-white/10 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none" />
                    </label>
                    <button className="rounded-[8px] bg-tandoori px-4 py-3 font-black text-ink">Save item</button>
                  </div>
                </form>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactElement; label: string; value: string }) {
  return (
    <div className="flex h-full flex-col rounded-[8px] bg-white p-5 shadow-card">
      <div className="mb-5 text-tandoori">{icon}</div>
      <div className="text-sm font-black uppercase tracking-[0.18em] text-charcoal/45">{label}</div>
      <div className="mt-auto break-words pt-2 text-2xl font-black">{value}</div>
    </div>
  );
}
