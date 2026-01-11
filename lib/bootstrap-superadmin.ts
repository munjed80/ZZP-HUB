import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const SUPERADMIN_EMAIL = "media.pro80@hotmail.com";
const SUPERADMIN_PASSWORD = "M22022012h!";

/**
 * Bootstrap SUPERADMIN user at application startup.
 * 
 * This function ensures that a SUPERADMIN user exists with the correct credentials.
 * It will:
 * - Create the user if it doesn't exist
 * - Update the role to SUPERADMIN if it exists but has a different role
 * - Update the password hash if it exists but password doesn't match
 * - Set emailVerified to true
 * 
 * This is safe for production as it only affects the specific SUPERADMIN account.
 */
export async function bootstrapSuperadmin(prisma: PrismaClient): Promise<void> {
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
          role: UserRole.SUPERADMIN,
          emailVerified: true,
        },
      });
      console.log("[SUPERADMIN_READY] Created SUPERADMIN user");
      return;
    }

    // User exists - check if updates are needed
    const updates: {
      role?: UserRole;
      password?: string;
      emailVerified?: boolean;
    } = {};

    // Check if role needs update
    if (existingUser.role !== UserRole.SUPERADMIN) {
      updates.role = UserRole.SUPERADMIN;
      console.log(`[SUPERADMIN_READY] Updating role from ${existingUser.role} to SUPERADMIN`);
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
      console.log("[SUPERADMIN_READY] SUPERADMIN user already configured correctly");
    }
  } catch (error) {
    console.error("[SUPERADMIN_LOGIN_FAILED] Failed to bootstrap SUPERADMIN:", error);
    throw error;
  }
}
