import { createFileRoute, Navigate } from "@tanstack/react-router";

// Fallback route for the Web Share Target action. When the service worker
// is active it intercepts the POST directly and 303-redirects to /?source=pwa_share.
// If the SW is not yet installed (first visit, preview, etc.) the browser will
// land on this GET and we just bounce to the printer home page.
export const Route = createFileRoute("/share-handler")({
  component: ShareHandlerFallback,
});

function ShareHandlerFallback() {
  return <Navigate to="/" search={{ source: "pwa_share" } as never} replace />;
}
