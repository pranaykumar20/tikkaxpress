import ContentPageShell from "@/components/ContentPageShell";
import type { Metadata } from "next";
import Link from "next/link";
import { defaultRestaurantLocation, restaurantConfig } from "@/lib/restaurant";

export const metadata: Metadata = {
  title: "Terms of Service | TikkaXpress",
  description: "Terms of Service for ordering from TikkaXpress online — pickup, delivery, payments, and policies."
};

export default function TermsPage() {
  const lastUpdated = "June 29, 2026";

  return (
    <ContentPageShell
      eyebrow="Legal"
      title="Terms of Service"
      lead="These terms apply when you order from TikkaXpress through our website. By placing an order, you agree to the policies below."
    >
      <p className="text-sm font-semibold text-charcoal/55">Last updated: {lastUpdated}</p>

      <ContentPageShell.Section title="1. Ordering">
        <p>
          Orders placed on this website are offers to purchase food from {restaurantConfig.name} at{" "}
          {defaultRestaurantLocation.address}. We may accept, modify, or decline an order based on item availability,
          kitchen capacity, or delivery area limits.
        </p>
        <p>
          Menu items, descriptions, photos, and prices may change without notice. Final pricing is confirmed at checkout
          through our ordering system.
        </p>
      </ContentPageShell.Section>

      <ContentPageShell.Section title="2. Pickup & delivery">
        <p>
          Pickup times are estimates. Please arrive within a reasonable window after your order is marked ready. For
          delivery, you must provide a complete, accurate address and a working phone number so our team or delivery
          partner can reach you.
        </p>
        <p>
          Delivery availability may be limited to certain ZIP codes and subject to fees shown at checkout. Minimum order
          amounts may apply when configured.
        </p>
      </ContentPageShell.Section>

      <ContentPageShell.Section title="3. Payments">
        <p>
          Online payments are processed securely through Toast or other authorized payment providers. By submitting payment
          information, you authorize us to charge the total shown at checkout, including tax, delivery fees, tips, and
          applicable discounts.
        </p>
        <p>
          Promo codes must be entered at checkout and are subject to expiration, usage limits, and eligibility rules. We
          reserve the right to cancel or adjust orders if a promo is misused or applied in error.
        </p>
      </ContentPageShell.Section>

      <ContentPageShell.Section title="4. Cancellations & refunds">
        <p>
          Because food is prepared fresh, cancellation requests must be made as soon as possible. Once preparation has
          started, refunds may not be available. If there is a problem with your order — missing items, quality concerns,
          or incorrect charges — contact us at{" "}
          <a href={`tel:${defaultRestaurantLocation.phone.replace(/[^+\d]/g, "")}`} className="font-bold text-ember">
            {defaultRestaurantLocation.phone}
          </a>{" "}
          and we will work to make it right.
        </p>
      </ContentPageShell.Section>

      <ContentPageShell.Section title="5. Allergies & dietary needs">
        <p>
          Our kitchen handles common allergens including dairy, nuts, gluten, and shellfish. While we take care with
          preparation, cross-contact may occur. If you have a severe allergy or dietary restriction, note it in your order
          instructions and call the restaurant to confirm before ordering.
        </p>
      </ContentPageShell.Section>

      <ContentPageShell.Section title="6. Website use">
        <p>
          You agree not to misuse this website, attempt unauthorized access, or interfere with ordering systems. Content on
          this site — including logos, menu copy, and images — is owned by TikkaXpress or used with permission and may not
          be copied without consent.
        </p>
      </ContentPageShell.Section>

      <ContentPageShell.Section title="7. Contact">
        <p>
          Questions about these terms? Reach us at {defaultRestaurantLocation.phone} or visit{" "}
          <Link href="/about" className="font-bold text-ember underline-offset-2 hover:underline">
            About TikkaXpress
          </Link>
          .
        </p>
        <p className="text-sm text-charcoal/55">
          This page is provided for general information and does not constitute legal advice. Restaurant policies may be
          updated from time to time.
        </p>
      </ContentPageShell.Section>
    </ContentPageShell>
  );
}
