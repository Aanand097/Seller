import { Link } from "@tanstack/react-router";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-20 border-t bg-gradient-to-b from-white to-accent/40">
      <div className="container mx-auto max-w-7xl px-4 py-14 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2 space-y-4">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-sm">
            The premium marketplace for AI subscriptions. Discover, buy, and manage the world's best AI tools — all in one place.
          </p>
          <div className="flex items-center gap-3">
            {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
              <a key={i} href="#" className="h-9 w-9 grid place-items-center rounded-lg border bg-white hover:bg-accent transition">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <FooterCol title="Marketplace" links={[["Products", "/products"], ["Categories", "/products"], ["About", "/about"], ["Contact", "/contact"]]} />
        <FooterCol title="Support" links={[["FAQ", "/faq"], ["Contact us", "/contact"], ["Order tracking", "/dashboard/orders"], ["Help center", "/faq"]]} />
        <FooterCol title="Legal" links={[["Privacy Policy", "/legal/privacy"], ["Terms", "/legal/terms"], ["Refund Policy", "/legal/refund"], ["Cookie Policy", "/legal/cookies"], ["Disclaimer", "/legal/disclaimer"]]} />
      </div>
      <div className="border-t">
        <div className="container mx-auto max-w-7xl px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} NexusAI Marketplace. All rights reserved.</p>
          <p>Crafted with care for premium AI buyers.</p>
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