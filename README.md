# ZZP HUB

Moderne SaaS-omgeving voor Nederlandse ZZP’ers met een maandelijks abonnement. Gebouwd met Next.js (App Router), TypeScript en Tailwind CSS (Shadcn-structuur voor UI-componenten).

## Modules
- **Dashboard (Overzicht)**: snelle blik op omzet, kosten en reserveringen.
- **Facturen**: concepten, verzending en betalingen.
- **Uitgaven**: kostenlogboek met bonnen-placeholder.
- **BTW-aangifte**: kwartaaloverzicht en stappenplan.
- **Instellingen**: profiel en abonnement (maandelijks) met auth-placeholder.

## Ontwikkelen
1. Installeer dependencies: `npm install`
2. Start lokaal: `npm run dev`
3. Lint: `npm run lint`

Authenticatie is voorbereid voor integratie met bijvoorbeeld NextAuth of een eigen SSO-provider; sessiebeveiliging wordt centraal afgehandeld in de layout.
