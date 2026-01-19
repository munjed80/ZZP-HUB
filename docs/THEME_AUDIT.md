# Theme Audit Report
Generated: 2026-01-19T01:14:29.138Z

## Summary

Found **53** potential hardcoded color issues in **15** files.

## Recommendations

1. Replace `text-gray-900`, `text-black` with `text-foreground`
2. Replace `bg-white` with `bg-background` or `bg-card`
3. Replace `border-gray-300`, `border-gray-200` with `border-border`
4. Use semantic color tokens from `globals.css`

## Issues by File


### `app/(auth)/layout.tsx`

Found 2 issue(s):

- **Line 10**: `text-slate-900`
  ```
  <div className="min-h-screen bg-[#f8f9fa] text-slate-900">
  ```
- **Line 77**: `bg-white`
  ```
  <div className="relative flex items-center justify-center bg-white">
  ```

### `app/(dashboard)/admin/companies/companies-client.tsx`

Found 1 issue(s):

- **Line 188**: `text-slate-900`
  ```
  <div className="font-semibold text-slate-900">
  ```

### `app/(dashboard)/facturen/loading.tsx`

Found 1 issue(s):

- **Line 11**: `bg-white`
  ```
  <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
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

### `app/(dashboard)/instellingen/settings-form.tsx`

Found 14 issue(s):

- **Line 48**: `text-gray-900`
  ```
  "w-full px-4 py-3 rounded-lg border text-gray-900",
  ```
- **Line 167**: `text-gray-900`
  ```
  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-
  ```
- **Line 242**: `text-gray-900`
  ```
  <p className="font-medium text-gray-900">KOR-regeling toepassen</p>
  ```
- **Line 42**: `text-gray-700`
  ```
  <label className="block text-sm font-medium text-gray-700">
  ```
- **Line 163**: `text-gray-700`
  ```
  <label className="block text-sm font-medium text-gray-700">
  ```
- **Line 183**: `text-gray-700`
  ```
  <label className="block text-sm font-medium text-gray-700">
  ```
- **Line 210**: `bg-white`
  ```
  className="h-14 w-14 rounded-lg border border-gray-200 object-contain bg-white p-1"
  ```
- **Line 237**: `bg-white`
  ```
  "absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
  ```
- **Line 49**: `border-gray-300`
  ```
  error ? "border-rose-300 focus:ring-rose-500" : "border-gray-300 focus:ring-teal-500",
  ```
- **Line 167**: `border-gray-300`
  ```
  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-
  ```
- **Line 189**: `border-gray-300`
  ```
  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-base file:mr-4 file:py-2 file:px-
  ```
- **Line 204**: `border-gray-200`
  ```
  <div className="mt-3 flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
  ```
- **Line 210**: `border-gray-200`
  ```
  className="h-14 w-14 rounded-lg border border-gray-200 object-contain bg-white p-1"
  ```
- **Line 219**: `border-gray-200`
  ```
  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
  ```

### `app/(dashboard)/relaties/loading.tsx`

Found 1 issue(s):

- **Line 10**: `bg-white`
  ```
  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
  ```

### `app/error.tsx`

Found 1 issue(s):

- **Line 31**: `text-slate-900`
  ```
  <h2 className="mb-4 text-3xl font-bold text-slate-900">
  ```

### `app/not-found.tsx`

Found 2 issue(s):

- **Line 9**: `text-slate-900`
  ```
  <h1 className="mb-2 text-9xl font-bold text-slate-900">404</h1>
  ```
- **Line 12**: `text-slate-900`
  ```
  <h2 className="mb-4 text-3xl font-bold text-slate-900">
  ```

### `app/offline/page.tsx`

Found 1 issue(s):

- **Line 15**: `text-slate-900`
  ```
  <h1 className="text-2xl font-semibold text-slate-900">Je bent offline</h1>
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

### `components/ui/button.tsx`

Found 2 issue(s):

- **Line 38**: `text-slate-900`
  ```
  "text-slate-700 dark:text-slate-200 border border-transparent hover:border-slate-200/60 dark:hover:b
  ```
- **Line 26**: `bg-white`
  ```
  "text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200/80 dark:borde
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
