/**
 * Lightweight fallback for node test runner (ESM) to avoid TSX resolution issues.
 * The real implementation lives in accountant-mode.tsx for Next.js.
 */
export default async function AccountantMode() {
  return null;
}
