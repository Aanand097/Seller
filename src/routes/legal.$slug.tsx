import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";

const PAGES: Record<string, { title: string; body: string }> = {
  privacy: { title: "Privacy Policy", body: "We respect your privacy and only collect data necessary to provide our service. We never sell your data. Contact us for any privacy requests." },
  terms: { title: "Terms & Conditions", body: "By using NexusAI you agree to use the service lawfully and not to redistribute purchased subscriptions. Full terms govern your use of the platform." },
  refund: { title: "Refund Policy", body: "Refunds are available within 24 hours of purchase if your subscription cannot be activated. Contact support for assistance." },
  cookies: { title: "Cookie Policy", body: "We use essential cookies for authentication and analytics cookies to improve the experience. You can disable optional cookies in your browser." },
  disclaimer: { title: "Disclaimer", body: "NexusAI is an independent marketplace and is not affiliated with the underlying AI providers. All trademarks belong to their owners." },
};

export const Route = createFileRoute("/legal/$slug")({
  component: Legal,
});

function Legal() {
  const { slug } = Route.useParams();
  const page = PAGES[slug] ?? { title: "Not found", body: "This page does not exist." };
  return (
    <PublicLayout>
      <section className="container mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-5xl font-bold">{page.title}</h1>
        <p className="mt-6 text-muted-foreground leading-relaxed">{page.body}</p>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </section>
    </PublicLayout>
  );
}