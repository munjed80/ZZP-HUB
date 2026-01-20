const ACCOUNTANT_ROLES = ["ACCOUNTANT", "ACCOUNTANT_VIEW", "ACCOUNTANT_EDIT"];

export function getDefaultRedirectForRole(role) {
  if (role === "SUPERADMIN") return "/admin";
  if (ACCOUNTANT_ROLES.includes(role)) return "/accountant-portal";
  return "/dashboard";
}

export function isAccountantRoleLite(role) {
  return ACCOUNTANT_ROLES.includes(role);
}

/**
 * Resolve the safest redirect after login based on the selected login type,
 * requested redirect (next/callbackUrl) and the authenticated user role.
 *
 * Safety rules:
 * - Accountant roles always end up at /accountant-portal, even if ZZP was selected.
 * - Non-accountants are never sent to /accountant-portal, even if accountant was selected.
 * - SUPERADMIN keeps their default (/admin) but won't be forced to the accountant portal.
 */
export function resolveLoginRedirect({ role, selectedType, requestedRedirect }) {
  const normalizedType = selectedType === "accountant" ? "accountant" : "zzp";
  const typeDefault = normalizedType === "accountant" ? "/accountant-portal" : "/dashboard";

  let target = requestedRedirect ?? typeDefault;
  const isAccountant = isAccountantRoleLite(role);
  const roleDefault = getDefaultRedirectForRole(role);

  if (isAccountant && !target.startsWith("/accountant-portal")) {
    target = "/accountant-portal";
  } else if (role === "SUPERADMIN" && target.startsWith("/accountant-portal")) {
    target = roleDefault;
  } else if (!isAccountant && target.startsWith("/accountant-portal")) {
    target = "/dashboard";
  }

  return target;
}
