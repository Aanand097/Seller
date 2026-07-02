import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";

type Section = { heading: string; body: string };
type Page = { title: string; intro: string; sections: Section[] };

const PAGES: Record<string, Page> = {
  privacy: {
    title: "Privacy Policy",
    intro:
      "NextGen E-Learning respects your privacy. This policy explains what we collect, why we collect it, and the choices you have.",
    sections: [
      { heading: "Information we collect", body: "Account details (name, email, phone, age, address, avatar), order history, support messages, reviews, and basic device/usage analytics." },
      { heading: "How we use your data", body: "To deliver your courses and subscriptions, process payments, provide customer support, send important account notifications, and improve the platform." },
      { heading: "Sharing", body: "We never sell your data. We share only with processors that are required to deliver the service (hosting, payment processing, email)." },
      { heading: "Your rights", body: "You may request access, correction or deletion of your data at any time by contacting support@nextgen-elearning.com. Admins can also delete your account on request." },
      { heading: "Retention", body: "We keep your data for as long as your account is active. After deletion, backups are purged within 30 days." },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro:
      "By creating an account or making a purchase you agree to the following terms governing the use of NextGen E-Learning.",
    sections: [
      { heading: "Accounts", body: "You must provide accurate information and keep your password secure. One account per person. Admins may suspend or delete accounts that violate these terms." },
      { heading: "Acceptable use", body: "Do not resell, redistribute, scrape, reverse-engineer or share credentials for purchased subscriptions. Do not abuse the chat, reviews or any other feature." },
      { heading: "Intellectual property", body: "All courses, brand assets and platform code belong to NextGen E-Learning or its licensors and are protected by copyright." },
      { heading: "Termination", body: "We may suspend or close accounts that violate these terms, attempt fraud, or harm other users. Outstanding refunds are still honoured per the Refund Policy." },
      { heading: "Changes", body: "We may update these terms; the latest version always applies and is dated below." },
    ],
  },
  refund: {
    title: "Refund & Pricing Policy",
    intro:
      "We want every purchase to be worth it. This policy covers product pricing, refunds and order disputes.",
    sections: [
      { heading: "Pricing", body: "Prices are shown in NPR (रु) on every product page and at checkout. Discounted prices reflect the final price you pay; the original price is shown with a strike-through. Taxes, where applicable, are included. Prices may change without notice but orders already placed are honoured at the price shown at the time of purchase." },
      { heading: "Refund window", body: "You can request a full refund within 24 hours of purchase if the subscription cannot be activated or differs materially from its description." },
      { heading: "How to request", body: "Open the in-app Chat with support or email support@nextgen-elearning.com with your order ID. Refunds are returned to the original payment method within 5–10 business days." },
      { heading: "Non-refundable cases", body: "Refunds are not granted for change of mind after a credential has been delivered and used, or where abuse / fraud is detected." },
      { heading: "Order disputes", body: "Admins review every dispute manually. While a dispute is open, the order is marked as 'scam_review' and access may be paused until resolved." },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    intro:
      "Cookies and similar technologies help keep you signed in and improve the platform.",
    sections: [
      { heading: "Essential cookies", body: "Used for authentication and to remember your cart. The platform will not work properly without these." },
      { heading: "Analytics cookies", body: "Aggregated, anonymous data used to understand which pages and courses are popular so we can improve them." },
      { heading: "Your choices", body: "You can clear or block cookies in your browser. Blocking essential cookies will sign you out." },
    ],
  },
  disclaimer: {
    title: "Disclaimer",
    intro:
      "NextGen E-Learning provides learning resources and AI subscriptions for educational use.",
    sections: [
      { heading: "No professional advice", body: "Content on the platform is for educational purposes only and is not a substitute for professional advice." },
      { heading: "Third-party tools", body: "Some products are subscriptions to third-party AI tools. We are not affiliated with those providers and their own terms apply once activated." },
      { heading: "Availability", body: "We aim for 99.9% uptime but do not guarantee uninterrupted access; planned maintenance will be announced in advance where possible." },
    ],
  },
  admin: {
    title: "Admin & Moderation Policy",
    intro:
      "Administrators of NextGen E-Learning are bound by additional rules to keep the platform safe and fair.",
    sections: [
      { heading: "Scope of admin powers", body: "Admins can create, edit and remove products and categories; review and update order statuses (pending, processing, delivered, cancelled, archived, scam_review); reply to user support messages; and enable or disable user logins." },
      { heading: "Account actions", body: "Admins may disable login for any user who violates the Terms, and may delete accounts on user request or after confirmed abuse. Admins cannot disable or delete their own account." },
      { heading: "Data access", body: "Admins access user data strictly for support, fraud prevention and legal compliance. All admin actions are logged." },
      { heading: "Pricing & promotions", body: "Only admins can change product prices. Changes apply only to future orders; orders already placed keep the price the customer paid." },
      { heading: "Accountability", body: "Admin accounts use the same authentication as regular users and are protected by role-based access enforced at the database level." },
    ],
  },
};

export const Route = createFileRoute("/legal/$slug")({
  component: Legal,
});

function Legal() {
  const { slug } = Route.useParams();
  const page = PAGES[slug];
  return (
    <PublicLayout>
      <section className="container mx-auto max-w-3xl px-4 py-20">
        {!page ? (
          <>
            <h1 className="font-display text-5xl font-bold">Not found</h1>
            <p className="mt-6 text-muted-foreground">This policy page does not exist.</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-5xl font-bold">{page.title}</h1>
            <p className="mt-6 text-muted-foreground leading-relaxed">{page.intro}</p>
            <div className="mt-10 space-y-8">
              {page.sections.map((s) => (
                <div key={s.heading}>
                  <h2 className="font-display text-xl font-semibold">{s.heading}</h2>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </>
        )}
      </section>
    </PublicLayout>
  );
}