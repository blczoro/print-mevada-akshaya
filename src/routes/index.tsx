import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { UploadCloud, Sliders, Printer, ArrowRight, ShieldCheck, Zap, Smartphone, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{ background: "var(--gradient-surface)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full blur-3xl opacity-30"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> No operator. No queue. No hassle.
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Print from anywhere,{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-hero)" }}
              >
                in seconds.
              </span>
            </h1>
            <p className="mt-5 text-base text-muted-foreground sm:text-lg">
              Upload your document from any device, configure your settings, and send it
              straight to the nearest printer. That's it.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="shadow-[var(--shadow-elegant)]">
                <Link to="/print">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload document
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#how">See how it works <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Three simple steps</h2>
          <p className="mt-3 text-muted-foreground">From your phone to paper — in under a minute.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: UploadCloud, title: "Upload", body: "Drag & drop or pick a file from your device. PDFs, Office docs, and images all welcome." },
            { icon: Sliders,     title: "Configure", body: "Choose color, duplex, paper size, page range, and copies. Preview instantly." },
            { icon: Printer,     title: "Print",     body: "Pick a nearby printer, hit print, and grab your pages. You'll get a job ID to track it." },
          ].map((s, i) => (
            <div
              key={s.title}
              className="group relative rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <div
                className="grid h-11 w-11 place-items-center rounded-xl text-primary-foreground shadow-[var(--shadow-elegant)]"
                style={{ background: "var(--gradient-hero)" }}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Step {i + 1}</p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60 bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for busy places.</h2>
              <p className="mt-3 text-muted-foreground">
                Libraries, campuses, coworking spaces, offices. Wherever people print, SwiftPrint
                makes it fast, self-service, and reliable.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild><Link to="/print">Get started</Link></Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Smartphone, title: "Any device", body: "Phone, tablet, laptop — same clean experience." },
                { icon: Zap,         title: "Fast",       body: "Uploads and previews render instantly." },
                { icon: ShieldCheck, title: "Private",    body: "Files aren't stored longer than the print job needs." },
                { icon: FileCheck2,  title: "All formats",body: "PDF, Word, PowerPoint, Excel, images, TXT." },
              ].map((f) => (
                <div key={f.title} className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                  <f.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
