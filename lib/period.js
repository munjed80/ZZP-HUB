/**
 * Normalize period selection to a concrete date range.
 * Supports month / quarter / year / custom ranges based on URL search params.
 */
export function normalizePeriod(searchParams) {
  const params =
    searchParams instanceof URLSearchParams
      ? searchParams
      : new URLSearchParams(cleanRecord(searchParams || {}));
  const period = (params.get("period") || "month").toLowerCase();
  const now = new Date();
  const year = parseInt(params.get("year") || `${now.getFullYear()}`, 10);
  const month = clampMonth(parseInt(params.get("month") || `${now.getMonth() + 1}`, 10));

  if (period === "custom") {
    const from = parseDate(params.get("from"));
    const to = parseDate(params.get("to"));
    if (from && to && from < to) {
      return { from, to };
    }
  }

  if (period === "quarter") {
    const quarter = clampQuarter(parseInt(params.get("quarter") || `${currentQuarter(now)}`, 10));
    const from = new Date(year, (quarter - 1) * 3, 1);
    const to = new Date(year, quarter * 3, 1);
    return { from, to };
  }

  if (period === "year") {
    const from = new Date(year, 0, 1);
    const to = new Date(year + 1, 0, 1);
    return { from, to };
  }

  // Default: month
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  return { from, to };
}

function clampMonth(value) {
  if (Number.isInteger(value) && value >= 1 && value <= 12) return value;
  return new Date().getMonth() + 1;
}

function clampQuarter(value) {
  if (Number.isInteger(value) && value >= 1 && value <= 4) return value;
  return currentQuarter(new Date());
}

function currentQuarter(date) {
  return Math.floor(date.getMonth() / 3) + 1;
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function cleanRecord(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null));
}

export const NormalizedPeriod = undefined;
