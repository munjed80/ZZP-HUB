# Theme Audit Report
Generated automatically by theme-audit.mjs

## Summary

Found **29** potential hardcoded color issues in **7** files.

## Recommendations

1. Replace `text-gray-900`, `text-black` with `text-foreground`
2. Replace `bg-white` with `bg-background` or `bg-card`
3. Replace `border-gray-300`, `border-gray-200` with `border-border`
4. Use semantic color tokens from `globals.css`

## Issues by File


### `app/(dashboard)/admin/companies/companies-client.tsx`

Found 1 issue(s):

- **Line 188**: `text-slate-900`
  ```
  <div className="font-semibold text-slate-900">
  ```

### `app/(dashboard)/facturen/voorbeeld/page.tsx`

Found 6 issue(s):

- **Line 50**: `text-slate-900`
  ```
  <h1 className="text-2xl font-bold text-slate-900">Factuurweergave</h1>
  ```
- **Line 72**: `text-slate-900`
  ```
  <p className="text-2xl font-bold tracking-tight text-slate-900">{bedrijf.companyName}</p>
  ```
- **Line 81**: `text-slate-900`
  ```
  <p className="text-sm font-semibold text-slate-900">Verzender</p>
  ```
- **Line 92**: `text-slate-900`
  ```
  <p className="text-sm font-semibold text-slate-900">Ontvanger</p>
  ```
- **Line 133**: `text-slate-900`
  ```
  <span className="font-semibold text-slate-900">Automatisch berekend</span>
  ```
- **Line 56**: `bg-white`
  ```
  <Card className="bg-white">
  ```

### `components/assistant/assistant-demo.tsx`

Found 3 issue(s):

- **Line 49**: `text-slate-900`
  ```
  <h3 className="text-xl font-semibold tracking-tight text-slate-900">Vraag & antwoord, binnen scope</
  ```
- **Line 60**: `bg-white`
  ```
  className="flex items-start gap-2 rounded-xl border border-[rgb(var(--brand-primary))/0.28] bg-white
  ```
- **Line 73**: `bg-white`
  ```
  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-teal-700 ring-1 ring-tea
  ```

### `components/assistant/assistant-drawer.tsx`

Found 5 issue(s):

- **Line 83**: `text-slate-900`
  ```
  <p className="text-sm font-semibold text-slate-900">Snelle hulp binnen het dashboard</p>
  ```
- **Line 99**: `text-slate-900`
  ```
  <p className="font-semibold text-slate-900">{assistantGuide.product.name}</p>
  ```
- **Line 132**: `text-slate-900`
  ```
  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shado
  ```
- **Line 111**: `bg-white`
  ```
  className="rounded-full border border-[rgb(var(--brand-primary))/0.28] bg-white px-3 py-1.5 text-xs 
  ```
- **Line 132**: `bg-white`
  ```
  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shado
  ```

### `components/layout/user-avatar-menu.tsx`

Found 1 issue(s):

- **Line 51**: `text-slate-900`
  ```
  <p className="text-sm font-semibold text-slate-900">{userName}</p>
  ```

### `components/sidebar/sidebar-brand.tsx`

Found 1 issue(s):

- **Line 41**: `text-slate-900`
  ```
  <p className="text-sm font-semibold tracking-tight text-slate-900">ZZP HUB</p>
  ```

### `components/support/support-form.tsx`

Found 12 issue(s):

- **Line 75**: `text-slate-900`
  ```
  <p className="text-base font-semibold text-slate-900">Message received. We will reply soon.</p>
  ```
- **Line 112**: `text-slate-900`
  ```
  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shado
  ```
- **Line 128**: `text-slate-900`
  ```
  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 
  ```
- **Line 144**: `text-slate-900`
  ```
  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shado
  ```
- **Line 159**: `text-slate-900`
  ```
  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shado
  ```
- **Line 176**: `text-slate-900`
  ```
  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 
  ```
- **Line 71**: `bg-white`
  ```
  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold
  ```
- **Line 112**: `bg-white`
  ```
  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shado
  ```
- **Line 128**: `bg-white`
  ```
  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 
  ```
- **Line 144**: `bg-white`
  ```
  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shado
  ```
- **Line 159**: `bg-white`
  ```
  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shado
  ```
- **Line 176**: `bg-white`
  ```
  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 
  ```

## Next Steps

1. Review each file and replace hardcoded colors with theme tokens
2. Test both light and dark modes after changes
3. Re-run this script to verify fixes: `npm run theme:audit`

## Exceptions

The following paths are excluded from this audit as they intentionally use hardcoded colors:
- `components/pdf/`
- `components/emails/`
- `components/landing/landing-content.tsx`
- `components/dashboard/`
