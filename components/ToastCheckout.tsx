"use client";

import { CreditCard, LoaderCircle, Lock } from "lucide-react";

type ToastCheckoutProps = {
  orderId?: string;
  paymentIntentId?: string;
  sessionSecret?: string;
  checkoutUrl?: string | null;
  demo?: boolean;
  amountLabel: string;
  loading?: boolean;
  liveReady?: boolean;
  onPay: () => void;
};

export default function ToastCheckout({
  checkoutUrl,
  demo = true,
  amountLabel,
  loading = false,
  liveReady = false,
  onPay
}: ToastCheckoutProps) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <Lock className="h-4 w-4 text-charcoal/55" />
        <div>
          <p className="text-sm font-black text-charcoal/80">Secure Toast payment</p>
          <p className="text-xs font-semibold text-charcoal/50">Pay with card, Apple Pay, or Google Pay through Toast.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-card">
        {liveReady && checkoutUrl && !demo ? (
          <iframe title="Toast checkout" src={checkoutUrl} className="h-[460px] w-full bg-white" allow="payment *" />
        ) : (
          <div className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-black/8 pb-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-xs font-black text-white">T</span>
                <span className="text-sm font-black text-charcoal/75">Toast Payments</span>
              </div>
              <span className="text-lg font-black text-ink">{amountLabel}</span>
            </div>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-charcoal/45">Card number</span>
              <div className="relative mt-2">
                <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/35" />
                <input
                  readOnly
                  value="1234 1234 1234 1234"
                  className="w-full rounded-xl border border-black/10 bg-cream/50 px-10 py-3.5 font-semibold text-charcoal/45 outline-none"
                  aria-label="Card number"
                />
              </div>
            </label>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-charcoal/45">Expiry</span>
                <input
                  readOnly
                  value="MM / YY"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-cream/50 px-4 py-3.5 font-semibold text-charcoal/45 outline-none"
                  aria-label="Expiry"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-charcoal/45">CVC</span>
                <input
                  readOnly
                  value="CVC"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-cream/50 px-4 py-3.5 font-semibold text-charcoal/45 outline-none"
                  aria-label="CVC"
                />
              </label>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" disabled className="rounded-xl bg-black py-3.5 text-sm font-black text-white opacity-90">
                Apple Pay
              </button>
              <button type="button" disabled className="rounded-xl border border-black/10 bg-white py-3.5 text-sm font-black text-ink opacity-90">
                Google Pay
              </button>
            </div>

            {demo && (
              <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                Demo mode — card fields are visual only until Toast credentials are configured. Click pay to simulate checkout.
              </p>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={onPay}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-tandoori py-4 text-lg font-black text-ink shadow-glow transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
              {loading ? "Processing..." : `Pay ${amountLabel}`}
            </button>

            <p className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-charcoal/45">
              <Lock className="h-3.5 w-3.5" />
              Secured by Toast
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
