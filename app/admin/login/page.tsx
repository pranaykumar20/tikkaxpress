import Link from "next/link";
import { Lock } from "lucide-react";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <form action="/api/admin/login" method="post" className="w-full max-w-md rounded-[8px] bg-white p-8 shadow-card">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-ink text-tandoori">
          <Lock className="h-7 w-7" />
        </div>
        <p className="mt-6 text-sm font-black uppercase tracking-[0.22em] text-ember">Restaurant login</p>
        <h1 className="mt-2 text-3xl font-black">TikkaXpress Admin</h1>
        <p className="mt-3 text-sm font-semibold text-charcoal/62">Use the owner credentials configured in the environment.</p>
        {params.error && <p className="mt-4 rounded-[8px] bg-red-50 p-3 text-sm font-bold text-red-700">Invalid admin credentials.</p>}
        <label className="mt-5 block">
          <span className="text-sm font-black text-charcoal/70">Email</span>
          <input name="email" type="email" required className="mt-2 w-full rounded-[8px] border border-black/10 bg-cream px-4 py-3 outline-none focus:focus-ring" />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-black text-charcoal/70">Password</span>
          <input name="password" type="password" required className="mt-2 w-full rounded-[8px] border border-black/10 bg-cream px-4 py-3 outline-none focus:focus-ring" />
        </label>
        <button className="mt-6 w-full rounded-[8px] bg-tandoori px-5 py-4 font-black text-ink shadow-glow">Sign in</button>
        <Link href="/" className="mt-4 block text-center text-sm font-black text-charcoal/55">
          Back to storefront
        </Link>
      </form>
    </main>
  );
}
