import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="mb-2 text-9xl font-bold text-foreground">404</h1>
          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
        </div>
        <h2 className="mb-4 text-3xl font-bold text-foreground">
          Oeps! Pagina niet gevonden.
        </h2>
        <p className="mb-8 text-lg text-muted-foreground">
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110"
        >
          <Home className="h-5 w-5" />
          Terug naar Dashboard
        </Link>
      </div>
    </div>
  );
}
