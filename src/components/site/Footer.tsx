import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-20 border-t bg-gradient-to-b from-white to-accent/40">
      <div className="container mx-auto max-w-7xl px-4 py-14 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2 space-y-4">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-sm">
            NextGen E-Learning — the modern marketplace for premium learning subscriptions and AI-powered study tools. Learn faster, smarter, and together.
          </p>
          <div className="flex items-center gap-3">
            <a href="mailto:support@nextgen-elearning.com" className="h-9 w-9 grid place-items-center rounded-lg border bg-white hover:bg-accent transition" aria-label="Email support">
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
        <FooterCol title="Explore" links={[["Courses", "/products"], ["Categories", "/products"], ["About", "/about"], ["Reviews", "/reviews"], ["Contact", "/contact"]]} />
        <FooterCol title="Support" links={[["FAQ", "/faq"], ["Contact us", "/contact"], ["Order tracking", "/dashboard/orders"], ["Help center", "/faq"]]} />
        <FooterCol title="Legal" links={[["Privacy Policy", "/legal/privacy"], ["Terms", "/legal/terms"], ["Refund & Pricing", "/legal/refund"], ["Cookie Policy", "/legal/cookies"], ["Admin Policy", "/legal/admin"], ["Disclaimer", "/legal/disclaimer"]]} />
      </div>
      <div className="border-t">
        <div className="container mx-auto max-w-7xl px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} NextGen E-Learning. All rights reserved.</p>
          <p>Built for ambitious learners.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="font-semibold mb-3 text-sm">{title}</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={href + label}>
            <Link to={href} className="hover:text-primary transition">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}