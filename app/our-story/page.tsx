import ContentPageShell from "@/components/ContentPageShell";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Story | TikkaXpress",
  description: "How TikkaXpress brings Indian comfort food to Northside Cincinnati — fresh, fast, and made with care."
};

export default function OurStoryPage() {
  return (
    <ContentPageShell
      eyebrow="TikkaXpress"
      title="Our Story"
      lead="We opened TikkaXpress with a simple idea: great Indian food should feel warm, familiar, and fast enough for real life."
    >
      <ContentPageShell.Section title="From spice to speed">
        <p>
          TikkaXpress started in Northside Cincinnati with a love for the flavors we grew up with — slow-simmered curries,
          fragrant biryani, tandoor-fresh naan, and the kind of meals that feel like home.
        </p>
        <p>
          We wanted a place where students, families, and neighbors could grab a full Indian meal without the long wait.
          That is why we built our menu around express pickup and delivery, weekday lunch combos, and dishes that travel well
          without losing their soul.
        </p>
      </ContentPageShell.Section>

      <ContentPageShell.Section title="A mural of two worlds">
        <p>
          Walk into our Northside location and you will see it on the walls — a mural that blends iconic Indian landmarks
          with the Cincinnati skyline. It is our way of saying this kitchen belongs to both places: the heritage behind
          every recipe and the city we serve every day.
        </p>
        <p>
          Orange, cream, and bold spice tones run through our space the same way they run through our food — vibrant,
          welcoming, and unmistakably TikkaXpress.
        </p>
      </ContentPageShell.Section>

      <ContentPageShell.Section title="What we stand for">
        <ul className="list-disc space-y-2 pl-5">
          <li>Fresh ingredients and consistent recipes, batch after batch</li>
          <li>Vegetarian-friendly options and clear spice levels on every dish</li>
          <li>Fair weekday lunch value for campus, office, and neighborhood regulars</li>
          <li>Order direct from us — pickup or delivery with secure checkout</li>
        </ul>
        <p>
          Whether it is your first butter chicken or your hundredth lunch combo, we are here to make it easy, delicious,
          and ready when you are.
        </p>
        <p>
          <Link href="/menu" className="font-black text-ember underline-offset-2 hover:underline">
            Browse the menu →
          </Link>
        </p>
      </ContentPageShell.Section>
    </ContentPageShell>
  );
}
