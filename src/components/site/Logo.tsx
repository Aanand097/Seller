import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 group ${className}`}>
      <div className="relative">
        <div className="h-9 w-9 rounded-xl grid place-items-center text-white" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
          <GraduationCap className="h-5 w-5" />
        </div>
      </div>
      <span className="font-display text-xl font-bold tracking-tight">
        NextGen <span className="gradient-text">E-Learning</span>
      </span>
    </Link>
  );
}