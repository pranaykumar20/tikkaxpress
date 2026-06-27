"use client";

import { BellRing, Printer } from "lucide-react";
import { useEffect, useState } from "react";

export function PrintTicketsButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-black text-white shadow-card sm:w-auto">
      <Printer className="h-4 w-4" />
      Print tickets
    </button>
  );
}

export function NewOrderAlert({ count }: { count: number }) {
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    if (!soundEnabled || count === 0) return;
    const audio = new Audio("data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YRAAAAAA////AP//AAD//wAA//8AAP//AAD//wAA");
    audio.play().catch(() => undefined);
  }, [count, soundEnabled]);

  if (count === 0) return null;

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-[8px] border border-tandoori/35 bg-orange-100 p-4 text-ink shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 font-black">
        <BellRing className="h-5 w-5 text-ember" />
        {count} new paid order{count === 1 ? "" : "s"} need attention
      </div>
      <label className="inline-flex items-center gap-2 text-sm font-black">
        <input type="checkbox" checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} />
        Sound alert
      </label>
    </div>
  );
}
