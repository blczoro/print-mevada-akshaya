// Register the service worker only in real published environments.
// Skips Lovable preview, iframe previews, dev, and ?sw=off.

const PREVIEW_HOST_SUFFIXES = [
  ".lovableproject.com",
  ".lovableproject-dev.com",
  ".beta.lovable.dev",
];
const PREVIEW_HOST_EXACT = new Set([
  "lovableproject.com",
  "lovableproject-dev.com",
  "beta.lovable.dev",
]);

function isPreviewHost(hostname: string): boolean {
  if (hostname.startsWith("id-preview--") || hostname.startsWith("preview--")) return true;
  if (PREVIEW_HOST_EXACT.has(hostname)) return true;
  return PREVIEW_HOST_SUFFIXES.some((s) => hostname.endsWith(s));
}

async function unregisterMatching(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith("/service-worker.js");
        })
        .map((r) => r.unregister()),
    );
  } catch {
    /* noop */
  }
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const inIframe = window.self !== window.top;
  const url = new URL(window.location.href);
  const killed = url.searchParams.get("sw") === "off";
  const isPreview = isPreviewHost(window.location.hostname);
  const isDev = !import.meta.env.PROD;

  if (killed || inIframe || isPreview || isDev) {
    void unregisterMatching();
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .catch(() => {
        /* swallow */
      });
  });
}
