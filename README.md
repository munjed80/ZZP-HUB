# ZZP HUB

Moderne SaaS-omgeving voor Nederlandse ZZP’ers met een maandelijks abonnement. Gebouwd met Next.js (App Router), TypeScript en Tailwind CSS (Shadcn-structuur voor UI-componenten).

## Modules
- **Dashboard (Overzicht)**: kernstatistieken, workflow en urenhint 1225h.
- **Facturen**: aanmaken (RHF + Zod), BTW 21/9/0/verlegd, voorbeeld/print.
- **Relaties**: klant-CRUD placeholder met adres/BTW-id.
- **Offertes**: beheer en conversie naar factuur.
- **Uitgaven**: kostenlogboek met BTW-context.
- **Uren**: urenregistratie voor 1225-criterium.
- **BTW-aangifte**: kwartaaloverzicht en stappenplan.
- **Instellingen**: bedrijf- en abonnementformulieren, auto-fill voor facturen.

## Ontwikkelen
1. Installeer dependencies: `npm install`
2. Prisma client genereren (optioneel voor DB): `npx prisma generate`
3. Start lokaal: `npm run dev`
4. Lint: `npm run lint`
5. PWA testen:
   - Start lokaal via `npm run dev` (service worker werkt alleen op `localhost` of via HTTPS).
   - Controleer manifest en icons in Chrome DevTools > Application > Manifest.
   - Valideer caching in Chrome DevTools > Application > Service Workers; alleen statische assets worden gecachet.
   - Installatie testen: desktop Chrome/Edge “Install app”; op iOS via Safari → Deel-icoon → “Zet op beginscherm”.

Authenticatie is voorbereid voor integratie met bijvoorbeeld NextAuth of een eigen SSO-provider; sessiebeveiliging wordt centraal afgehandeld in de layout. Alle UI-teksten zijn in het Nederlands en valuta wordt als € 1.250,00 getoond.
