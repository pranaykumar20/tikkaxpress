import Link from "next/link";
import { XCircle } from "lucide-react";

export default async function CancelledPage({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="max-w-xl rounded-[8px] bg-white p-8 text-center shadow-card">
        <XCircle className="mx-auto h-14 w-14 text-ember" />
        <h1 className="mt-5 text-4xl font-black">Payment cancelled</h1>
        <p className="mt-3 text-charcoal/68">Your cart was not charged. Return to checkout when you are ready.</p>
        {params.order_id && <p className="mt-4 rounded-[8px] bg-cream p-3 text-sm font-bold text-charcoal/60">Pending order reference: {params.order_id}</p>}
        <Link href="/" className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 font-black text-white">
          Return to menu
        </Link>
      </section>
    </main>
  );
}
