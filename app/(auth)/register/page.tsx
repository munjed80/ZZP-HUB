"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  naam: z.string().min(2, "Naam is verplicht"),
  email: z.string().email("Voer een geldig e-mailadres in"),
  wachtwoord: z.string().min(6, "Minimaal 6 tekens"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPagina() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { naam: "", email: "", wachtwoord: "" },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          ZZP HUB
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Registreren</h1>
        <p className="text-sm text-slate-600">
          Maak een account aan. Authenticatie wordt gekoppeld aan sessies met SSO of NextAuth.
        </p>
      </div>

      <form className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800">Naam</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            {...form.register("naam")}
          />
          {form.formState.errors.naam && (
            <p className="text-xs text-amber-700">{form.formState.errors.naam.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800">E-mailadres</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            type="email"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-amber-700">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800">Wachtwoord</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            type="password"
            {...form.register("wachtwoord")}
          />
          {form.formState.errors.wachtwoord && (
            <p className="text-xs text-amber-700">{form.formState.errors.wachtwoord.message}</p>
          )}
        </div>

        <button
          type="button"
          onClick={form.handleSubmit((data) => console.log("Registratie", data))}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Registreer
        </button>
      </form>

      <p className="text-center text-xs text-slate-500">
        Door te registreren ga je akkoord met de voorwaarden en privacyverklaring.
      </p>
    </div>
  );
}
