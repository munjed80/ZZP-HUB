/**
 * Data Migration Script: Populate companyId for Multi-Tenant Isolation
 * 
 * This script migrates existing data to the new multi-tenant structure:
 * 1. Creates a Company for each existing User with CompanyProfile
 * 2. Links Users to their Companies
 * 3. Populates companyId on all tenant-bound entities
 * 
 * Run this AFTER applying the Prisma migration that adds the Company model
 * and companyId fields.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateToMultiTenant() {
  console.log("Starting multi-tenant data migration...");

  try {
    // Step 1: Create Companies from existing CompanyProfiles
    console.log("\n[1/4] Creating Company records from CompanyProfiles...");
    
    const usersWithProfiles = await prisma.user.findMany({
      where: {
        companyProfile: {
          isNot: null,
        },
      },
      include: {
        companyProfile: true,
      },
    });

    console.log(`Found ${usersWithProfiles.length} users with company profiles`);

    const companyMap = new Map<string, string>(); // userId -> companyId

    for (const user of usersWithProfiles) {
      if (!user.companyProfile) continue;

      const profile = user.companyProfile;
      
      // Create or find company
      const company = await prisma.company.create({
        data: {
          name: profile.companyName,
          kvkNumber: profile.kvkNumber,
          btwNumber: profile.btwNumber,
          address: profile.address,
          postalCode: profile.postalCode,
          city: profile.city,
          isActive: true,
        },
      });

      companyMap.set(user.id, company.id);
      console.log(`Created Company ${company.id} for user ${user.email}`);
    }

    // Step 2: Link Users to Companies
    console.log("\n[2/4] Linking Users to Companies...");
    
    for (const [userId, companyId] of companyMap.entries()) {
      await prisma.user.update({
        where: { id: userId },
        data: { companyId },
      });
      console.log(`Linked user ${userId} to company ${companyId}`);
    }

    // Step 3: Populate companyId on all tenant-bound entities
    console.log("\n[3/4] Populating companyId on tenant entities...");

    // Update Clients
    const clients = await prisma.client.findMany({
      select: { id: true, userId: true },
    });
    
    for (const client of clients) {
      const companyId = companyMap.get(client.userId);
      if (companyId) {
        await prisma.client.update({
          where: { id: client.id },
          data: { companyId },
        });
      }
    }
    console.log(`Updated ${clients.length} clients`);

    // Update Invoices
    const invoices = await prisma.invoice.findMany({
      select: { id: true, userId: true },
    });
    
    for (const invoice of invoices) {
      const companyId = companyMap.get(invoice.userId);
      if (companyId) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { companyId },
        });
      }
    }
    console.log(`Updated ${invoices.length} invoices`);

    // Update Quotations
    const quotations = await prisma.quotation.findMany({
      select: { id: true, userId: true },
    });
    
    for (const quotation of quotations) {
      const companyId = companyMap.get(quotation.userId);
      if (companyId) {
        await prisma.quotation.update({
          where: { id: quotation.id },
          data: { companyId },
        });
      }
    }
    console.log(`Updated ${quotations.length} quotations`);

    // Update Expenses
    const expenses = await prisma.expense.findMany({
      select: { id: true, userId: true },
    });
    
    for (const expense of expenses) {
      const companyId = companyMap.get(expense.userId);
      if (companyId) {
        await prisma.expense.update({
          where: { id: expense.id },
          data: { companyId },
        });
      }
    }
    console.log(`Updated ${expenses.length} expenses`);

    // Update TimeEntries
    const timeEntries = await prisma.timeEntry.findMany({
      select: { id: true, userId: true },
    });
    
    for (const timeEntry of timeEntries) {
      const companyId = companyMap.get(timeEntry.userId);
      if (companyId) {
        await prisma.timeEntry.update({
          where: { id: timeEntry.id },
          data: { companyId },
        });
      }
    }
    console.log(`Updated ${timeEntries.length} time entries`);

    // Update Events
    const events = await prisma.event.findMany({
      select: { id: true, userId: true },
    });
    
    for (const event of events) {
      const companyId = companyMap.get(event.userId);
      if (companyId) {
        await prisma.event.update({
          where: { id: event.id },
          data: { companyId },
        });
      }
    }
    console.log(`Updated ${events.length} events`);

    // Update SupportMessages (only for authenticated users)
    const supportMessages = await prisma.supportMessage.findMany({
      where: {
        userId: { not: null },
      },
      select: { id: true, userId: true },
    });
    
    for (const message of supportMessages) {
      if (!message.userId) continue;
      const companyId = companyMap.get(message.userId);
      if (companyId) {
        await prisma.supportMessage.update({
          where: { id: message.id },
          data: { companyId },
        });
      }
    }
    console.log(`Updated ${supportMessages.length} support messages`);

    // Step 4: Summary
    console.log("\n[4/4] Migration Summary:");
    console.log(`✓ Created ${companyMap.size} companies`);
    console.log(`✓ Linked ${companyMap.size} users to companies`);
    console.log(`✓ Updated ${clients.length} clients`);
    console.log(`✓ Updated ${invoices.length} invoices`);
    console.log(`✓ Updated ${quotations.length} quotations`);
    console.log(`✓ Updated ${expenses.length} expenses`);
    console.log(`✓ Updated ${timeEntries.length} time entries`);
    console.log(`✓ Updated ${events.length} events`);
    console.log(`✓ Updated ${supportMessages.length} support messages`);
    
    console.log("\n✅ Multi-tenant migration completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateToMultiTenant()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
