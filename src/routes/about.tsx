import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — NexusAI" }, { name: "description", content: "About the NexusAI marketplace." }] }),
  component: () => (
    <PublicLayout>
      <section className="container mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-5xl font-bold">About NexusAI</h1>
        <p className="mt-6 text-lg text-muted-foreground">NexusAI is the premium marketplace for AI subscriptions. We curate the best AI tools on the planet and make them effortless to buy, manage, and use — all under one roof.</p>
        <p className="mt-4 text-muted-foreground">Our mission is to give every builder, creator, and team instant access to a verified, premium AI stack with the polish of a real SaaS product.</p>
      </section>
    </PublicLayout>
  ),
});