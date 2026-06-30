"use client";

import { useState } from "react";
import { RefreshCw, RotateCcw } from "lucide-react";

type ToastStatus = {
  apiConfigured: boolean;
  paymentsConfigured: boolean;
  lastMenuSyncAt: string | null;
  unmappedItems: number;
  failedOrders: number;
  pendingToastPush: number;
};

export function ToastIntegrationPanel({ status, orders }: { status: ToastStatus; orders: { id: string; integrationError?: string | null; toastOrderGuid?: string | null }[] }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"sync" | "retry" | null>(null);

  async function syncMenu() {
    setLoading("sync");
    setMessage("");
    try {
      const response = await fetch("/api/admin/toast/sync-menu", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Menu sync failed.");
      setMessage(
        payload.mode === "demo"
          ? "Demo mode: menu sync timestamp updated. Configure Toast credentials to pull live menu data."
          : `Synced ${payload.itemsUpserted} items across ${payload.categoriesUpserted} categories.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Menu sync failed.");
    } finally {
      setLoading(null);
    }
  }

  async function retryOrder(orderId: string) {
    setLoading("retry");
    setMessage("");
    try {
      const response = await fetch("/api/admin/toast/retry-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Retry failed.");
      setMessage(`Order ${orderId} submitted to Toast (${payload.toastOrderGuid}).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Retry failed.");
    } finally {
      setLoading(null);
    }
  }

  const failedOrders = orders.filter((order) => order.integrationError && !order.toastOrderGuid);

  return (
    <section className="mb-8 rounded-[8px] border border-black/8 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-ember">Toast integration</p>
          <h2 className="mt-2 text-2xl font-black">POS + payments status</h2>
          <div className="mt-3 grid gap-2 text-sm font-semibold text-charcoal/65 sm:grid-cols-2">
            <span>API: {status.apiConfigured ? "Configured" : "Demo mode"}</span>
            <span>Payments: {status.paymentsConfigured ? "Configured" : "Demo mode"}</span>
            <span>Last menu sync: {status.lastMenuSyncAt ? new Date(status.lastMenuSyncAt).toLocaleString() : "Never"}</span>
            <span>Unmapped active items: {status.unmappedItems}</span>
            <span>Paid orders waiting for Toast: {status.pendingToastPush}</span>
            <span>Failed Toast pushes: {status.failedOrders}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={syncMenu}
          disabled={loading !== null}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-black text-white shadow-card disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading === "sync" ? "animate-spin" : ""}`} />
          Sync menu from Toast
        </button>
      </div>

      {message && <p className="mt-4 rounded-[8px] bg-cream p-3 text-sm font-bold text-charcoal/75">{message}</p>}

      {failedOrders.length > 0 && (
        <div className="mt-4 space-y-2">
          {failedOrders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex flex-col gap-2 rounded-[8px] border border-red-200 bg-red-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-red-900">
                {order.id}: {order.integrationError}
              </div>
              <button
                type="button"
                onClick={() => retryOrder(order.id)}
                disabled={loading !== null}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-700 px-4 py-2 text-sm font-black text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Retry Toast push
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
