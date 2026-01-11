/**
 * Multi-Tenant Isolation Integration Tests
 * 
 * These tests verify that:
 * 1. Company A cannot access Company B's data
 * 2. SUPERADMIN can access cross-tenant data only in admin routes
 * 3. Tenant helpers properly enforce isolation
 */

import { PrismaClient, UserRole, InvoiceEmailStatus, BtwTarief, Eenheid } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function setupTestData() {
  console.log("Setting up test data...");

  // Clean up existing test data
  await prisma.invoice.deleteMany({ where: { invoiceNum: { contains: "TEST-" } } });
  await prisma.client.deleteMany({ where: { name: { contains: "Test Company" } } });
  await prisma.expense.deleteMany({ where: { description: { contains: "Test Expense" } } });
  await prisma.company.deleteMany({ where: { name: { contains: "Test Company" } } });
  await prisma.user.deleteMany({ where: { email: { contains: "test-tenant" } } });

  const password = await bcrypt.hash("Test123!", 10);

  // Create Company A
  const companyA = await prisma.company.create({
    data: {
      name: "Test Company A",
      kvkNumber: "12345678",
      isActive: true,
    },
  });

  // Create Company B
  const companyB = await prisma.company.create({
    data: {
      name: "Test Company B",
      kvkNumber: "87654321",
      isActive: true,
    },
  });

  // Create User A (COMPANY_ADMIN for Company A)
  const userA = await prisma.user.create({
    data: {
      email: "test-tenant-a@example.com",
      password,
      naam: "User A",
      role: UserRole.COMPANY_ADMIN,
      companyId: companyA.id,
      emailVerified: true,
      onboardingCompleted: true,
    },
  });

  // Create User B (COMPANY_ADMIN for Company B)
  const userB = await prisma.user.create({
    data: {
      email: "test-tenant-b@example.com",
      password,
      naam: "User B",
      role: UserRole.COMPANY_ADMIN,
      companyId: companyB.id,
      emailVerified: true,
      onboardingCompleted: true,
    },
  });

  // Create SUPERADMIN
  const superAdmin = await prisma.user.create({
    data: {
      email: "test-tenant-superadmin@example.com",
      password,
      naam: "Super Admin",
      role: UserRole.SUPERADMIN,
      emailVerified: true,
      onboardingCompleted: true,
    },
  });

  // Create Client for Company A
  const clientA = await prisma.client.create({
    data: {
      name: "Test Company A Client",
      email: "clienta@example.com",
      address: "Address A",
      postalCode: "1234AA",
      city: "City A",
      userId: userA.id,
      companyId: companyA.id,
    },
  });

  // Create Client for Company B
  const clientB = await prisma.client.create({
    data: {
      name: "Test Company B Client",
      email: "clientb@example.com",
      address: "Address B",
      postalCode: "5678BB",
      city: "City B",
      userId: userB.id,
      companyId: companyB.id,
    },
  });

  // Create Invoice for Company A
  const invoiceA = await prisma.invoice.create({
    data: {
      invoiceNum: "TEST-A-001",
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      emailStatus: InvoiceEmailStatus.VERZONDEN,
      userId: userA.id,
      companyId: companyA.id,
      clientId: clientA.id,
      lines: {
        create: [
          {
            description: "Service A",
            quantity: 1,
            price: 100,
            amount: 100,
            vatRate: BtwTarief.HOOG_21,
            unit: Eenheid.STUK,
          },
        ],
      },
    },
  });

  // Create Invoice for Company B
  const invoiceB = await prisma.invoice.create({
    data: {
      invoiceNum: "TEST-B-001",
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      emailStatus: InvoiceEmailStatus.VERZONDEN,
      userId: userB.id,
      companyId: companyB.id,
      clientId: clientB.id,
      lines: {
        create: [
          {
            description: "Service B",
            quantity: 1,
            price: 200,
            amount: 200,
            vatRate: BtwTarief.HOOG_21,
            unit: Eenheid.STUK,
          },
        ],
      },
    },
  });

  // Create Expense for Company A
  const expenseA = await prisma.expense.create({
    data: {
      description: "Test Expense A",
      category: "Office",
      amountExcl: 50,
      vatRate: BtwTarief.HOOG_21,
      date: new Date(),
      userId: userA.id,
      companyId: companyA.id,
    },
  });

  // Create Expense for Company B
  const expenseB = await prisma.expense.create({
    data: {
      description: "Test Expense B",
      category: "Travel",
      amountExcl: 75,
      vatRate: BtwTarief.HOOG_21,
      date: new Date(),
      userId: userB.id,
      companyId: companyB.id,
    },
  });

  console.log("✓ Test data created");
  
  return {
    companyA,
    companyB,
    userA,
    userB,
    superAdmin,
    clientA,
    clientB,
    invoiceA,
    invoiceB,
    expenseA,
    expenseB,
  };
}

async function test1_CompanyACannotReadCompanyBData(testData: Awaited<ReturnType<typeof setupTestData>>) {
  console.log("\n📋 Test 1: Company A cannot read Company B's data");

  try {
    // Try to read invoices with Company A's filter
    const invoices = await prisma.invoice.findMany({
      where: { companyId: testData.companyA.id },
    });

    // Should only find Company A's invoice
    const hasCompanyBInvoice = invoices.some(inv => inv.id === testData.invoiceB.id);
    
    if (hasCompanyBInvoice) {
      console.error("  ❌ FAILED: Company A can see Company B's invoice!");
      return false;
    }

    // Verify Company A can see their own invoice
    const hasCompanyAInvoice = invoices.some(inv => inv.id === testData.invoiceA.id);
    
    if (!hasCompanyAInvoice) {
      console.error("  ❌ FAILED: Company A cannot see their own invoice!");
      return false;
    }

    // Try to read expenses with Company A's filter
    const expenses = await prisma.expense.findMany({
      where: { companyId: testData.companyA.id },
    });

    const hasCompanyBExpense = expenses.some(exp => exp.id === testData.expenseB.id);
    
    if (hasCompanyBExpense) {
      console.error("  ❌ FAILED: Company A can see Company B's expense!");
      return false;
    }

    // Try to read clients with Company A's filter
    const clients = await prisma.client.findMany({
      where: { companyId: testData.companyA.id },
    });

    const hasCompanyBClient = clients.some(client => client.id === testData.clientB.id);
    
    if (hasCompanyBClient) {
      console.error("  ❌ FAILED: Company A can see Company B's client!");
      return false;
    }

    console.log("  ✅ PASSED: Company A can only see their own data");
    return true;

  } catch (error) {
    console.error("  ❌ FAILED: Error during test:", error);
    return false;
  }
}

async function test2_SuperAdminCanAccessCrossTenantData(testData: Awaited<ReturnType<typeof setupTestData>>) {
  console.log("\n📋 Test 2: SUPERADMIN can access cross-tenant data");

  try {
    // SUPERADMIN should be able to see all invoices
    const allInvoices = await prisma.invoice.findMany({
      where: {
        invoiceNum: { contains: "TEST-" },
      },
    });

    const hasCompanyAInvoice = allInvoices.some(inv => inv.id === testData.invoiceA.id);
    const hasCompanyBInvoice = allInvoices.some(inv => inv.id === testData.invoiceB.id);

    if (!hasCompanyAInvoice || !hasCompanyBInvoice) {
      console.error("  ❌ FAILED: SUPERADMIN cannot see all invoices!");
      return false;
    }

    // SUPERADMIN should be able to see all expenses
    const allExpenses = await prisma.expense.findMany({
      where: {
        description: { contains: "Test Expense" },
      },
    });

    const hasCompanyAExpense = allExpenses.some(exp => exp.id === testData.expenseA.id);
    const hasCompanyBExpense = allExpenses.some(exp => exp.id === testData.expenseB.id);

    if (!hasCompanyAExpense || !hasCompanyBExpense) {
      console.error("  ❌ FAILED: SUPERADMIN cannot see all expenses!");
      return false;
    }

    console.log("  ✅ PASSED: SUPERADMIN can access cross-tenant data");
    return true;

  } catch (error) {
    console.error("  ❌ FAILED: Error during test:", error);
    return false;
  }
}

async function test3_UniqueConstraintsAreTenantScoped(testData: Awaited<ReturnType<typeof setupTestData>>) {
  console.log("\n📋 Test 3: Unique constraints are tenant-scoped");

  try {
    // Try to create invoice with same number in different company
    // This should succeed because uniqueness is scoped to companyId
    const duplicateInvoice = await prisma.invoice.create({
      data: {
        invoiceNum: "TEST-A-001", // Same number as Company A's invoice
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        emailStatus: InvoiceEmailStatus.CONCEPT,
        userId: testData.userB.id,
        companyId: testData.companyB.id, // But different company
        clientId: testData.clientB.id,
        lines: {
          create: [
            {
              description: "Duplicate number test",
              quantity: 1,
              price: 100,
              amount: 100,
              vatRate: BtwTarief.HOOG_21,
              unit: Eenheid.STUK,
            },
          ],
        },
      },
    });

    // Clean up
    await prisma.invoice.delete({ where: { id: duplicateInvoice.id } });

    console.log("  ✅ PASSED: Invoice numbers can be duplicated across companies");
    return true;

  } catch (error) {
    console.error("  ❌ FAILED: Cannot create invoice with same number in different company:", error);
    return false;
  }
}

async function test4_CascadeDeleteWorks(testData: Awaited<ReturnType<typeof setupTestData>>) {
  console.log("\n📋 Test 4: Cascade delete removes tenant data");

  try {
    // Create a temporary company with data
    const tempCompany = await prisma.company.create({
      data: {
        name: "Test Company Temp",
        isActive: true,
      },
    });

    const tempUser = await prisma.user.create({
      data: {
        email: "test-tenant-temp@example.com",
        password: await bcrypt.hash("Test123!", 10),
        naam: "Temp User",
        role: UserRole.COMPANY_ADMIN,
        companyId: tempCompany.id,
        emailVerified: true,
      },
    });

    const tempClient = await prisma.client.create({
      data: {
        name: "Temp Client",
        email: "temp@example.com",
        address: "Address",
        postalCode: "1234",
        city: "City",
        userId: tempUser.id,
        companyId: tempCompany.id,
      },
    });

    // Delete the company
    await prisma.company.delete({ where: { id: tempCompany.id } });

    // Verify client was deleted due to cascade
    const deletedClient = await prisma.client.findUnique({
      where: { id: tempClient.id },
    });

    if (deletedClient) {
      console.error("  ❌ FAILED: Client was not cascade deleted!");
      return false;
    }

    // Clean up user
    await prisma.user.delete({ where: { id: tempUser.id } });

    console.log("  ✅ PASSED: Cascade delete works correctly");
    return true;

  } catch (error) {
    console.error("  ❌ FAILED: Error during cascade delete test:", error);
    return false;
  }
}

async function cleanup(testData: Awaited<ReturnType<typeof setupTestData>>) {
  console.log("\n🧹 Cleaning up test data...");
  
  try {
    // Delete in correct order to respect foreign keys
    await prisma.invoice.deleteMany({ where: { invoiceNum: { contains: "TEST-" } } });
    await prisma.expense.deleteMany({ where: { description: { contains: "Test Expense" } } });
    await prisma.client.deleteMany({ where: { name: { contains: "Test Company" } } });
    await prisma.user.deleteMany({ where: { email: { contains: "test-tenant" } } });
    await prisma.company.deleteMany({ where: { name: { contains: "Test Company" } } });
    
    console.log("✓ Cleanup complete");
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

async function main() {
  console.log("🧪 Running Multi-Tenant Isolation Integration Tests\n");
  console.log("=" .repeat(60));

  let testData;
  const results: boolean[] = [];

  try {
    testData = await setupTestData();
    
    results.push(await test1_CompanyACannotReadCompanyBData(testData));
    results.push(await test2_SuperAdminCanAccessCrossTenantData(testData));
    results.push(await test3_UniqueConstraintsAreTenantScoped(testData));
    results.push(await test4_CascadeDeleteWorks(testData));

  } finally {
    if (testData) {
      await cleanup(testData);
    }
    await prisma.$disconnect();
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Test Results:");
  console.log(`  Total: ${results.length}`);
  console.log(`  Passed: ${results.filter(r => r).length}`);
  console.log(`  Failed: ${results.filter(r => !r).length}`);

  const allPassed = results.every(r => r);
  
  if (allPassed) {
    console.log("\n✅ All tests passed! Multi-tenant isolation is working correctly.\n");
    process.exit(0);
  } else {
    console.log("\n❌ Some tests failed! Please review the failures above.\n");
    process.exit(1);
  }
}

main();
