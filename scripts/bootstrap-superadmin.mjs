import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const SUPERADMIN_EMAIL = "media.pro80@hotmail.com";
const SUPERADMIN_PASSWORD = "M22022012h!";

/**
 * Bootstrap SUPERADMIN user.
 * This script is called at application startup to ensure SUPERADMIN exists.
 */
async function main() {
  const prisma = new PrismaClient();

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);

    // Find existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPERADMIN_EMAIL },
      select: {
        id: true,
        email: true,
        role: true,
        password: true,
        emailVerified: true,
      },
    });

    if (!existingUser) {
      // Create new SUPERADMIN user
      await prisma.user.create({
        data: {
          email: SUPERADMIN_EMAIL,
          password: hashedPassword,
          role: "SUPERADMIN",
          emailVerified: true,
        },
      });
      console.log("[SUPERADMIN_READY] Created SUPERADMIN user");
      return;
    }

    // User exists - check if updates are needed
    const updates = {};

    // Check if role needs update
    if (existingUser.role !== "SUPERADMIN") {
      updates.role = "SUPERADMIN";
      console.log(
        `[SUPERADMIN_READY] Updating role from ${existingUser.role} to SUPERADMIN`
      );
    }

    // Check if password needs update
    const passwordMatches = await bcrypt.compare(
      SUPERADMIN_PASSWORD,
      existingUser.password
    );
    if (!passwordMatches) {
      updates.password = hashedPassword;
      console.log("[SUPERADMIN_READY] Updating password hash");
    }

    // Check if emailVerified needs update
    if (!existingUser.emailVerified) {
      updates.emailVerified = true;
      console.log("[SUPERADMIN_READY] Setting emailVerified to true");
    }

    // Apply updates if needed
    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { email: SUPERADMIN_EMAIL },
        data: updates,
      });
      console.log("[SUPERADMIN_READY] SUPERADMIN user updated successfully");
    } else {
      console.log(
        "[SUPERADMIN_READY] SUPERADMIN user already configured correctly"
      );
    }
  } catch (error) {
    console.error("[SUPERADMIN_LOGIN_FAILED] Failed to bootstrap SUPERADMIN:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error("[SUPERADMIN_LOGIN_FAILED] Bootstrap failed:", error);
    process.exit(1);
  });
