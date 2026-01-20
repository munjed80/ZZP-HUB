const ACCOUNTANT_ROLES = ["ACCOUNTANT", "ACCOUNTANT_VIEW", "ACCOUNTANT_EDIT"];

export function getDefaultRedirectForRole(role) {
  if (role === "SUPERADMIN") return "/admin";
  if (ACCOUNTANT_ROLES.includes(role)) return "/accountant-portal";
  return "/dashboard";
}

export function isAccountantRoleLite(role) {
  return ACCOUNTANT_ROLES.includes(role);
}
