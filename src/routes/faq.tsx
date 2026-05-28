import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  ["How fast is delivery?", "Most subscriptions are activated within minutes of payment confirmation."],
  ["Are these official subscriptions?", "Yes — every subscription is verified and premium."],
  ["Can I get a refund?", "Yes, see our Refund Policy in the footer."],
  ["Do you support team accounts?", "Team plans are coming soon. Contact us for early access."],
  ["How do I chat with support?", "Sign in and use the Chat tab in your dashboard for instant support."],
];

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — NexusAI" }] }),
  component: () => (
    <PublicLayout>
      <section className="container mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-5xl font-bold text-center">Frequently asked questions</h1>
        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map(([q, a], i) => (
            <AccordionItem key={i} value={String(i)}>
              <AccordionTrigger className="text-left">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </PublicLayout>
  ),
});