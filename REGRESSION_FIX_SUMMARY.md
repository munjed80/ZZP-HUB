# Regression Fix Summary

## Files Changed
- lib/utils.ts
- components/layout/mobile-nav.tsx
- components/layout/sidebar.tsx
- components/layout/new-action-menu.tsx
- app/(dashboard)/instellingen/settings-form.tsx
- app/(dashboard)/instellingen/settings-tabs.tsx
- app/(dashboard)/facturen/nieuw/invoice-form.tsx
- app/(dashboard)/facturen/voorbeeld/page.tsx
- app/(dashboard)/relaties/relaties-client.tsx
- tests/mobile-nav.test.mjs

## Root Causes
- Accountant role detection treated STAFF as accountant, hiding the normal ZZP/admin navigation (including Instellingen).
- Legacy/light-only UI classes (bg-white/text-slate + missing theme-safe focus styles) caused low-contrast inputs and a white block in dark mode.
- Navigation arrays lacked automated guards against duplicate hrefs, increasing the risk of accidental route overlap.

## Manual Test Checklist
- [ ] As ZZP/COMPANY_ADMIN, verify bottom nav shows Instellingen and routes to /instellingen.
- [ ] As accountant, verify Portal/BTW nav items appear and Instellingen is absent.
- [ ] As STAFF, verify standard ZZP navigation (Instellingen visible).
- [ ] In dark mode, confirm settings (Bedrijfsgegevens) inputs have readable text/placeholders.
- [ ] In dark mode, confirm Facturen list + new invoice form inputs are readable.
- [ ] In dark mode, confirm Relaties search + modal inputs are readable.
- [ ] Open /facturen/voorbeeld and confirm it no longer renders a white/legacy block in dark mode.
