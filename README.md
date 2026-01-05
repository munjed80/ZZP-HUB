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
