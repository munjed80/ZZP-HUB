export type Platform = "web" | "ios" | "android";

function getCapacitorPlatform(): Platform | null {
  try {
    // Capacitor injects a global object at runtime; avoid hard dependency during web builds
    const capacitorGlobal = (globalThis as unknown as {
      Capacitor?: { getPlatform?: () => string };
    }).Capacitor;

    const platform = capacitorGlobal?.getPlatform?.();
    if (platform === "android" || platform === "ios") {
      return platform;
    }
  } catch {
    // ignore and fall back to user agent detection
  }
  return null;
}

function getUserAgentPlatform(): Platform | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  const ua = navigator.userAgent || "";

  if (/android/i.test(ua)) {
    return "android";
  }

  if (/iPad|iPhone|iPod/.test(ua)) {
    return "ios";
  }

  return null;
}

export function detectPlatform(): Platform {
  const capacitorPlatform = getCapacitorPlatform();
  if (capacitorPlatform) return capacitorPlatform;

  const userAgentPlatform = getUserAgentPlatform();
  if (userAgentPlatform) return userAgentPlatform;

  return "web";
}

export function isNativeAndroid() {
  return detectPlatform() === "android";
}

export function isNativeIOS() {
  return detectPlatform() === "ios";
}

export function isWeb() {
  return detectPlatform() === "web";
}
