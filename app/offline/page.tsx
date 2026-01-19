import Link from "next/link";

export const metadata = {
  title: "Offline | ZZP HUB",
  description: "Je bent offline. Probeer opnieuw zodra je verbinding hebt.",
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl bg-card shadow-xl border border-border p-8 text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-2xl grid place-items-center shadow-lg">
          Z
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Je bent offline</h1>
        <p className="text-muted-foreground">
          Controleer je internetverbinding en probeer het opnieuw. De app blijft beschikbaar zodra je weer online bent.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-white font-semibold shadow hover:shadow-md hover:brightness-110 transition"
        >
          Opnieuw proberen
        </Link>
      </div>
    </main>
  );
}
