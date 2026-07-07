export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/60">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <p>© {new Date().getFullYear()} SwiftPrint. Self-service printing, done simply.</p>
        <p className="text-xs">Frontend prototype · Backend integration pending</p>
      </div>
    </footer>
  );
}