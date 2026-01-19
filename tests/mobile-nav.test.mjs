import { test, describe } from "node:test";
import assert from "node:assert/strict";

/**
 * Mobile Navigation Role-Based Tests
 * 
 * Regression tests to ensure:
 * 1. ZZP users see "Instellingen" that routes to /instellingen
 * 2. Accountant users don't see "Instellingen" pointing to /instellingen
 * 3. Navigation items are filtered correctly based on user role
 */

// User roles matching the Prisma schema
const UserRole = {
  SUPERADMIN: 'SUPERADMIN',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  STAFF: 'STAFF',
  ACCOUNTANT_VIEW: 'ACCOUNTANT_VIEW',
  ACCOUNTANT_EDIT: 'ACCOUNTANT_EDIT',
  ZZP: 'ZZP',
  ACCOUNTANT: 'ACCOUNTANT',
};

// ZZP/COMPANY_ADMIN navigation items (copied from mobile-nav.tsx)
const zzpNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/facturen", label: "Facturen" },
  { href: "/relaties", label: "Relaties" },
  { href: "/uitgaven", label: "Uitgaven" },
  { href: "/instellingen", label: "Instellingen" },
];

// Accountant navigation items (copied from mobile-nav.tsx)
const accountantNavItems = [
  { href: "/accountant-portal", label: "Portal" },
  { href: "/facturen", label: "Facturen" },
  { href: "/relaties", label: "Relaties" },
  { href: "/uitgaven", label: "Uitgaven" },
  { href: "/btw-aangifte", label: "BTW" },
];

// Check if user has accountant role (copied from mobile-nav.tsx)
const isAccountantRole = (role) =>
  role === UserRole.ACCOUNTANT_VIEW ||
  role === UserRole.ACCOUNTANT_EDIT ||
  role === UserRole.STAFF ||
  role === UserRole.ACCOUNTANT;

// Get navigation items based on role (mimics mobile-nav.tsx logic)
function getNavItemsForRole(role) {
  // Default to ZZP nav if role is unknown/undefined (defensive check)
  return isAccountantRole(role) ? accountantNavItems : zzpNavItems;
}

// ============== Mobile Navigation Role Tests ==============

describe("Mobile Navigation Role-Based Filtering", () => {
  
  test("ZZP user sees Instellingen pointing to /instellingen", () => {
    const navItems = getNavItemsForRole(UserRole.ZZP);
    const instellingenItem = navItems.find(item => item.label === "Instellingen");
    
    assert.ok(instellingenItem, "ZZP user should see Instellingen navigation item");
    assert.strictEqual(instellingenItem.href, "/instellingen", "Instellingen should route to /instellingen");
  });
  
  test("COMPANY_ADMIN user sees Instellingen pointing to /instellingen", () => {
    const navItems = getNavItemsForRole(UserRole.COMPANY_ADMIN);
    const instellingenItem = navItems.find(item => item.label === "Instellingen");
    
    assert.ok(instellingenItem, "COMPANY_ADMIN user should see Instellingen navigation item");
    assert.strictEqual(instellingenItem.href, "/instellingen", "Instellingen should route to /instellingen");
  });
  
  test("SUPERADMIN user sees Instellingen pointing to /instellingen", () => {
    const navItems = getNavItemsForRole(UserRole.SUPERADMIN);
    const instellingenItem = navItems.find(item => item.label === "Instellingen");
    
    assert.ok(instellingenItem, "SUPERADMIN user should see Instellingen navigation item");
    assert.strictEqual(instellingenItem.href, "/instellingen", "Instellingen should route to /instellingen");
  });
  
  test("ACCOUNTANT_VIEW user does NOT see Instellingen", () => {
    const navItems = getNavItemsForRole(UserRole.ACCOUNTANT_VIEW);
    const instellingenItem = navItems.find(item => item.label === "Instellingen");
    
    assert.strictEqual(instellingenItem, undefined, "ACCOUNTANT_VIEW user should NOT see Instellingen navigation item");
  });
  
  test("ACCOUNTANT_EDIT user does NOT see Instellingen", () => {
    const navItems = getNavItemsForRole(UserRole.ACCOUNTANT_EDIT);
    const instellingenItem = navItems.find(item => item.label === "Instellingen");
    
    assert.strictEqual(instellingenItem, undefined, "ACCOUNTANT_EDIT user should NOT see Instellingen navigation item");
  });
  
  test("ACCOUNTANT user does NOT see Instellingen", () => {
    const navItems = getNavItemsForRole(UserRole.ACCOUNTANT);
    const instellingenItem = navItems.find(item => item.label === "Instellingen");
    
    assert.strictEqual(instellingenItem, undefined, "ACCOUNTANT user should NOT see Instellingen navigation item");
  });
  
  test("STAFF user does NOT see Instellingen", () => {
    const navItems = getNavItemsForRole(UserRole.STAFF);
    const instellingenItem = navItems.find(item => item.label === "Instellingen");
    
    assert.strictEqual(instellingenItem, undefined, "STAFF user should NOT see Instellingen navigation item");
  });
  
  test("Accountant users see Portal pointing to /accountant-portal", () => {
    const navItems = getNavItemsForRole(UserRole.ACCOUNTANT_VIEW);
    const portalItem = navItems.find(item => item.label === "Portal");
    
    assert.ok(portalItem, "Accountant user should see Portal navigation item");
    assert.strictEqual(portalItem.href, "/accountant-portal", "Portal should route to /accountant-portal");
  });
  
  test("Accountant users see BTW pointing to /btw-aangifte", () => {
    const navItems = getNavItemsForRole(UserRole.ACCOUNTANT_EDIT);
    const btwItem = navItems.find(item => item.label === "BTW");
    
    assert.ok(btwItem, "Accountant user should see BTW navigation item");
    assert.strictEqual(btwItem.href, "/btw-aangifte", "BTW should route to /btw-aangifte");
  });
  
  test("ZZP users do NOT see Portal", () => {
    const navItems = getNavItemsForRole(UserRole.ZZP);
    const portalItem = navItems.find(item => item.label === "Portal");
    
    assert.strictEqual(portalItem, undefined, "ZZP user should NOT see Portal navigation item");
  });
  
  test("Unknown/undefined role defaults to ZZP navigation", () => {
    const navItemsUndefined = getNavItemsForRole(undefined);
    const navItemsNull = getNavItemsForRole(null);
    const navItemsEmpty = getNavItemsForRole("");
    
    // All should have Instellingen
    assert.ok(navItemsUndefined.find(item => item.label === "Instellingen"), "Undefined role should default to ZZP nav");
    assert.ok(navItemsNull.find(item => item.label === "Instellingen"), "Null role should default to ZZP nav");
    assert.ok(navItemsEmpty.find(item => item.label === "Instellingen"), "Empty role should default to ZZP nav");
    
    // None should have Portal
    assert.strictEqual(navItemsUndefined.find(item => item.label === "Portal"), undefined, "Undefined role should NOT have Portal");
    assert.strictEqual(navItemsNull.find(item => item.label === "Portal"), undefined, "Null role should NOT have Portal");
    assert.strictEqual(navItemsEmpty.find(item => item.label === "Portal"), undefined, "Empty role should NOT have Portal");
  });
});

// ============== Regression Test: No /accountant-portal redirect for ZZP ==============

describe("Regression: Instellingen Navigation", () => {
  
  test("ZZP user clicking Instellingen should NOT be redirected to /accountant-portal", () => {
    const navItems = getNavItemsForRole(UserRole.ZZP);
    const instellingenItem = navItems.find(item => item.label === "Instellingen");
    
    assert.ok(instellingenItem, "Instellingen should exist for ZZP user");
    assert.notStrictEqual(instellingenItem.href, "/accountant-portal", "Instellingen should NOT route to /accountant-portal");
    assert.strictEqual(instellingenItem.href, "/instellingen", "Instellingen should route to /instellingen");
  });
  
  test("Accountant user navigation should NOT have any item routing to /instellingen", () => {
    const navItems = getNavItemsForRole(UserRole.ACCOUNTANT);
    const instellingenRoute = navItems.find(item => item.href === "/instellingen");
    
    assert.strictEqual(instellingenRoute, undefined, "Accountant navigation should NOT have any route to /instellingen");
  });
  
  test("Accountant navigation items only contain allowed routes", () => {
    const allowedRoutes = [
      '/accountant-portal',
      '/dashboard',
      '/facturen',
      '/relaties',
      '/uitgaven',
      '/btw-aangifte',
      '/agenda',
    ];
    
    const navItems = getNavItemsForRole(UserRole.ACCOUNTANT);
    
    for (const item of navItems) {
      assert.ok(
        allowedRoutes.includes(item.href),
        `Route ${item.href} should be in allowed routes for accountant`
      );
    }
  });
});
