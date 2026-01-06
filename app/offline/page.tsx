import Link from "next/link";

export const metadata = {
  title: "Offline | ZZP HUB",
  description: "Je bent offline. Probeer opnieuw zodra je verbinding hebt.",
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white/90 shadow-xl border border-slate-200 p-8 text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-700 text-white font-bold text-2xl grid place-items-center shadow-lg">
          Z
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Je bent offline</h1>
        <p className="text-slate-600">
          Controleer je internetverbinding en probeer het opnieuw. De app blijft beschikbaar zodra je weer online bent.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-700 to-emerald-500 px-4 py-2 text-white font-semibold shadow hover:shadow-md transition"
        >
          Opnieuw proberen
        </Link>
      </div>
    </main>
  );
}
