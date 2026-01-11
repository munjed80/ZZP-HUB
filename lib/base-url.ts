const FALLBACK_LOCAL_URL = "http://localhost:3000";

function sanitize(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getAppBaseUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL;

  if (envUrl) {
    return sanitize(envUrl);
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return sanitize(window.location.origin);
  }

  return FALLBACK_LOCAL_URL;
}

export function buildAbsoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = getAppBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}
