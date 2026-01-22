import { describe, test } from "node:test";
import assert from "node:assert/strict";

/**
 * Tests for accountant invite menu visibility
 * 
 * These tests verify that the "Accountant uitnodigen" menu item
 * appears correctly in the navigation based on user roles.
 */

// Mock navigation data (mirrors the actual sidebar.tsx structure)
const navigatie = [
  { href: "/dashboard", label: "Overzicht", icon: "LayoutDashboard" },
  { href: "/facturen", label: "Facturen", icon: "Receipt" },
  { href: "/relaties", label: "Relaties", icon: "Users" },
  { href: "/offertes", label: "Offertes", icon: "FileSignature" },
  { href: "/uitgaven", label: "Uitgaven", icon: "Wallet" },
  { href: "/btw-aangifte", label: "BTW-aangifte", icon: "FileText" },
  { href: "/agenda", label: "Agenda", icon: "CalendarDays" },
  { href: "/uren", label: "Uren", icon: "Clock3" },
  { href: "/ai-assist", label: "AI Assist", icon: "Sparkles" },
  { href: "/accountant-uitnodigen", label: "Accountant uitnodigen", icon: "UserPlus", companyAdminOnly: true },
  { href: "/support", label: "Support", icon: "LifeBuoy" },
  { href: "/instellingen", label: "Instellingen", icon: "Settings" },
  { href: "/admin/companies", label: "Companies", icon: "Building2", superAdminOnly: true },
  { href: "/admin/releases", label: "Releases", icon: "Rocket", superAdminOnly: true },
  { href: "/admin/support", label: "Support Inbox", icon: "Inbox", superAdminOnly: true },
];

/**
 * Filters navigation items based on user role (mirrors sidebar.tsx logic)
 */
function getVisibleNavItems(userRole) {
  return navigatie.filter((item) => {
    if (item.superAdminOnly && userRole !== "SUPERADMIN") {
      return false;
    }
    if (item.companyAdminOnly && userRole !== "COMPANY_ADMIN" && userRole !== "SUPERADMIN") {
      return false;
    }
    if (item.accountantOnly) {
      return false;
    }
    return true;
  });
}

describe("Accountant invite menu visibility", () => {
  test("menu item exists in navigation array", () => {
    const accountantMenuItem = navigatie.find((item) => item.href === "/accountant-uitnodigen");
    assert.ok(accountantMenuItem, "Accountant uitnodigen menu item should exist");
    assert.strictEqual(accountantMenuItem.label, "Accountant uitnodigen");
    assert.strictEqual(accountantMenuItem.companyAdminOnly, true);
  });

  test("COMPANY_ADMIN can see accountant invite menu", () => {
    const visibleItems = getVisibleNavItems("COMPANY_ADMIN");
    const accountantMenuItem = visibleItems.find((item) => item.href === "/accountant-uitnodigen");
    assert.ok(accountantMenuItem, "COMPANY_ADMIN should see Accountant uitnodigen menu item");
  });

  test("SUPERADMIN can see accountant invite menu", () => {
    const visibleItems = getVisibleNavItems("SUPERADMIN");
    const accountantMenuItem = visibleItems.find((item) => item.href === "/accountant-uitnodigen");
    assert.ok(accountantMenuItem, "SUPERADMIN should see Accountant uitnodigen menu item");
  });

  test("STAFF cannot see accountant invite menu", () => {
    const visibleItems = getVisibleNavItems("STAFF");
    const accountantMenuItem = visibleItems.find((item) => item.href === "/accountant-uitnodigen");
    assert.strictEqual(accountantMenuItem, undefined, "STAFF should NOT see Accountant uitnodigen menu item");
  });

  test("ACCOUNTANT cannot see accountant invite menu", () => {
    const visibleItems = getVisibleNavItems("ACCOUNTANT");
    const accountantMenuItem = visibleItems.find((item) => item.href === "/accountant-uitnodigen");
    assert.strictEqual(accountantMenuItem, undefined, "ACCOUNTANT should NOT see Accountant uitnodigen menu item");
  });

  test("menu icon is UserPlus", () => {
    const accountantMenuItem = navigatie.find((item) => item.href === "/accountant-uitnodigen");
    assert.strictEqual(accountantMenuItem?.icon, "UserPlus", "Menu item should use UserPlus icon");
  });
});
