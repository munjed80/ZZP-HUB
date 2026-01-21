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
- **Support Inbox (SuperAdmin)**: beheer supportberichten en status op `/admin/support`.

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
   - Productiecheck (standalone/Coolify):
     1. Build + start: `npm run build && npm run start`
     2. Headers/health: `curl -I https://<host>/sw.js`, `curl -I https://<host>/manifest.webmanifest`, `curl -I https://<host>/api/health`
     3. Update flow: open app, deploy een nieuwe versie en klik op de toast “Update beschikbaar” → “Nu updaten” om te herladen.
      4. Offline fallback: laad een pagina online, schakel offline en navigeer opnieuw; je ziet `/offline` en de Workbox fallback `/offline.html`. Herhaal op mobiel na “Zet op beginscherm”.

## Capacitor (Android/iOS) bundling
1. Installeer native tooling (alleen wanneer je de native bundel bouwt):
   ```bash
   npm install @capacitor/core @capacitor/cli
   npm install @capacitor/android @capacitor/ios
   ```
2. Build voor native bundling: `IS_CAPACITOR=true npm run build`
3. Sync native projecten: `npx cap sync`
4. Web bundle output staat in `out/` (export) en wordt opgehaald door Capacitor.

Authenticatie is voorbereid voor integratie met bijvoorbeeld NextAuth of een eigen SSO-provider; sessiebeveiliging wordt centraal afgehandeld in de layout. Alle UI-teksten zijn in het Nederlands en valuta wordt als € 1.250,00 getoond.

## Onboarding Flow Verification

De applicatie implementeert een complete Moneybird-achtige onboarding flow. Test deze met onderstaande checklist:

### Email Verificatie
- [ ] **Registratie**: Ga naar `/register` en maak een nieuw account aan
- [ ] **Email verzonden**: Controleer console logs voor verificatielink (in dev mode)
- [ ] **Check email pagina**: Wordt automatisch doorgestuurd naar `/check-email`
- [ ] **Verificatie**: Klik op de link in console of ga naar `/verify-email?token=...`
- [ ] **Succes**: Na verificatie wordt doorgestuurd naar `/onboarding`
- [ ] **Resend**: Test `/resend-verification` met rate limiting (max 1x per minuut)

### Route Guards
- [ ] **Niet ingelogd**: Alle dashboard routes redirecten naar `/login`
- [ ] **Ingelogd zonder verificatie**: Dashboard routes redirecten naar `/verify-required`
- [ ] **Geverifieerd zonder onboarding**: Dashboard routes redirecten naar `/onboarding`
- [ ] **Onboarding compleet**: Vrije toegang tot `/dashboard` en andere routes

### Onboarding Wizard (5 stappen)
- [ ] **Stap 1 - Welkom**: Overzicht van de setup stappen
- [ ] **Stap 2 - Bedrijf**: 
  - [ ] KVK zoeken werkt (mock data: "Test BV", "Demo Consultancy", etc.)
  - [ ] Selecteren van zoekresultaat vult formulier automatisch in
  - [ ] Handmatig invoeren werkt als fallback
  - [ ] Alle velden worden correct opgeslagen
- [ ] **Stap 3 - Eerste relatie**: 
  - [ ] Klantgegevens kunnen worden ingevoerd
  - [ ] BTW-ID is optioneel
  - [ ] Data wordt correct opgeslagen in database
- [ ] **Stap 4 - Beveiliging**: 
  - [ ] "Later instellen" knop werkt
  - [ ] Stap kan worden overgeslagen
- [ ] **Stap 5 - Celebration**: 
  - [ ] Confetti animatie wordt getoond
  - [ ] "Aan de slag" knop redirect naar `/dashboard`
  - [ ] Onboarding wordt als compleet gemarkeerd

### KVK Integratie
- [ ] **Search endpoint**: `/api/kvk/search?q=test` retourneert mock resultaten
- [ ] **Details endpoint**: `/api/kvk/details?kvk=12345678` retourneert bedrijfsdetails
- [ ] **Authenticatie**: Endpoints vereisen ingelogde gebruiker
- [ ] **Mock provider**: Werkt zonder API key configuratie

### Assistant Widget
- [ ] **Onboarding**: Widget toont context-aware hints tijdens onboarding
- [ ] **Dashboard**: Widget is beschikbaar maar niet opdringerig
- [ ] **Dismissible**: Widget kan worden gesloten
- [ ] **Outside click**: Sluit widget bij klikken buiten
- [ ] **Progress**: Toont voortgang tijdens onboarding (stap x van 5)

### Database Verificatie
Na volledige flow, controleer in database:
```sql
SELECT email, emailVerified, onboardingStep, onboardingCompleted 
FROM "User" 
WHERE email = 'test@example.com';
```
- [ ] `emailVerified = true`
- [ ] `onboardingStep = 5`
- [ ] `onboardingCompleted = true`
- [ ] CompanyProfile record bestaat
- [ ] Client record bestaat

### Productie Deployment
1. Zorg voor environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Random secret voor sessie-encryptie
   - `NEXTAUTH_URL`: Productie URL (bijv. https://app.example.com)
   - `RESEND_API_KEY`: Voor echte emails
   - `RESEND_FROM_EMAIL` of `EMAIL_FROM` (optioneel): Afzendernaam/e-mail voor alle uitgaande mails
   - `APP_URL` of `NEXT_PUBLIC_APP_URL`: Basis-URL voor links in e-mails
   - `KVK_API_KEY` (optioneel): Voor echte KVK integratie
   - DNS: stel SPF, DKIM en DMARC records in voor `zzpershub.nl` (Cloudflare) voor deliverability

2. Build en start + migrations:
   ```bash
   npm run build
   npm start
   ```
   `npm start` gebruikt `scripts/start-prod.mjs`: valideert verplichte env vars, draait `prisma migrate deploy` + `prisma generate`, doet een DB-connectivity check (`SELECT 1`) en start vervolgens de standalone server (`node .next/standalone/server.js`) op `HOST=0.0.0.0`.
   Als de database al tabellen heeft maar geen `_prisma_migrations` tabel bevat, markeert het startscript automatisch de baseline-migratie als toegepast via `prisma migrate resolve` en controleert het dat de onboarding- en emailkolommen aanwezig zijn.
   Coolify start command: **`npm start`** (migraties worden automatisch vóór de serverstart uitgevoerd).
   Capacitor bundling: na `npm run build` staat de complete webbundle in **`.next/standalone`**. De postbuild stap kopieert `public/` en `.next/static` naar deze map; gebruik dit pad als WebView payload voor Android/iOS (entrypoint: `server.js` in `.next/standalone`).

3. Snelle rooktest na deploy:
   ```bash
   SMOKE_BASE_URL="https://jouw-domein" npm run smoke:prod
   ```
   Controleert `/`, `/api/health`, `/sw.js` en `/manifest.webmanifest` op status 200.

## SEO & Icons Verificatie

### Favicon Verificatie
1. **Browser Tab Favicon**: 
   - Open de site in een browser en controleer of het favicon zichtbaar is in de tab
   - Doe een hard refresh (Ctrl+Shift+R of Cmd+Shift+R) om cache te wissen
   - Controleer direct: `https://matrixtop.com/favicon.ico`
   
2. **DevTools Check**:
   - Open Chrome DevTools > Application > Storage
   - Controleer onder "Frames" of de favicon correct wordt geladen
   - Verifieer dat `/favicon-16x16.png` en `/favicon-32x32.png` beschikbaar zijn

3. **iOS Home Screen Icon**:
   - Open de site op iOS Safari
   - Tik op Deel-icoon → "Zet op beginscherm"
   - Controleer of het apple-touch-icon correct wordt weergegeven

### Social Preview Verificatie (WhatsApp/Facebook/Twitter)
1. **Facebook Sharing Debugger**:
   - Ga naar: https://developers.facebook.com/tools/debug/
   - Voer URL in: `https://matrixtop.com`
   - Klik op "Scrape Again" om cache te wissen
   - Verifieer dat:
     - OpenGraph image wordt weergegeven (1200x630)
     - Title en description correct zijn
     - Geen fouten of waarschuwingen

2. **HTML Source Check**:
   - View Page Source in browser
   - Zoek naar meta tags:
     ```html
     <meta property="og:image" content="/og-image.png" />
     <meta property="og:title" content="ZZP-HUB | Elite Business Hub" />
     <meta name="twitter:card" content="summary_large_image" />
     ```

3. **WhatsApp Test**:
   - Verstuur de URL naar jezelf in WhatsApp
   - Verifieer dat de preview image, title en description correct worden weergegeven
   - Let op: WhatsApp cache kan tot 7 dagen duren; gebruik Facebook Debugger om te forceren

4. **Cache Headers**:
   - Controleer Response Headers voor `/og-image.png`:
     ```
     Cache-Control: public, max-age=3600, must-revalidate
     ```
   - Dit zorgt ervoor dat updates binnen 1 uur zichtbaar zijn

### SEO Verificatie
1. **Robots.txt**: Bezoek `https://matrixtop.com/robots.txt`
2. **Sitemap.xml**: Bezoek `https://matrixtop.com/sitemap.xml`
3. **Per-Page Metadata**: Controleer de `<title>` tag op elke pagina met format: "[Page Title] | ZZP-HUB"

## AI Assist

ZZP HUB bevat een geavanceerde AI-assistent die gebruikers helpt met natuurlijke taal in het Nederlands. De assistent kan facturen, offertes, uitgaven en relaties aanmaken, BTW berekenen, en vragen beantwoorden over de applicatie.

### Features
- **Multi-step data collectie**: Vraagt stap-voor-stap naar ontbrekende informatie
- **Preview & Confirm**: Toont preview voordat entiteiten worden aangemaakt
- **Dutch language parsing**: Herkent Nederlandse invoer zoals "320 stops @ 1,25"
- **Tenant isolation**: Strikte scheiding tussen gebruikers (userId scoping)
- **Audit logging**: Volledige logging met requestId voor observability
- **Debug mode**: Developer mode voor troubleshooting

### Ondersteunde Acties
1. **Facturen aanmaken**: "Maak factuur voor Acme BV 320 stops @ 1.25"
2. **Offertes aanmaken**: "Maak offerte voor Daily 40 uur x 75 euro"
3. **Uitgaven registreren**: "Registreer uitgave: koffie 15 euro 9% btw"
4. **Relaties toevoegen**: "Voeg klant toe: Acme BV, email@acme.nl"
5. **BTW berekenen**: "Hoeveel BTW ben ik verschuldigd deze maand?"
6. **Facturen opvragen**: "Toon onbetaalde facturen"
7. **Help vragen**: "Hoe maak ik een factuur?"

### Quick Start
1. Ga naar `/ai-assist` in de applicatie
2. Gebruik de quick action buttons of typ een vraag
3. Volg de instructies van de assistent
4. Bevestig previews voordat entiteiten worden aangemaakt

### Architectuur
Zie [AI_ASSIST_ARCHITECTURE.md](docs/AI_ASSIST_ARCHITECTURE.md) voor:
- Complete architectuur uitleg
- Request flow diagrammen
- Nieuwe acties toevoegen
- Testing & debugging
- Security best practices

### Debug Mode
Schakel debug mode in door op het bug-icoon rechtsboven te klikken. Dit toont:
- Request ID voor tracing
- Gedetecteerde intent
- Huidige draft velden
- Ontbrekende velden
- Validatie errors

### API Endpoints
- `POST /api/ai/chat` - Hoofd chat endpoint
- `POST /api/ai/intent` - Intent classificatie
- `POST /api/ai/draft/update` - Update conversatie draft
- `POST /api/ai/draft/confirm` - Bevestig en voer draft uit

### Security
- **Multi-tenant correctness**: Alle queries gescoped op userId uit sessie
- **No silent failures**: Altijd preview OF error met uitleg
- **Audit logging**: Elke actie gelogd met requestId
- **Input validation**: Zod schemas op alle lagen
- **Friendly errors**: Geen raw Prisma errors naar gebruiker
