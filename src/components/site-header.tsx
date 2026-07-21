import { Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Printer className="h-3.5 w-3.5" />
          </span>
          Print
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
