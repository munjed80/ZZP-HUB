import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="mb-2 text-9xl font-bold text-slate-900">404</h1>
          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-blue-500 to-sky-500"></div>
        </div>
        <h2 className="mb-4 text-3xl font-bold text-slate-900">
          Oeps! Pagina niet gevonden.
        </h2>
        <p className="mb-8 text-lg text-slate-600">
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-sky-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-sky-700 hover:shadow-xl"
        >
          <Home className="h-5 w-5" />
          Terug naar Dashboard
        </Link>
      </div>
    </div>
  );
}
