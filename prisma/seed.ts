import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "media.pro80@hotmail.com";
  const rawPassword = "M22022012h!";

  const password = await bcrypt.hash(rawPassword, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      password,
      role: UserRole.SUPERADMIN,
      emailVerified: true,
    },
    create: {
      email,
      password,
      role: UserRole.SUPERADMIN,
      emailVerified: true,
    },
  });

  console.log(`Seeded admin user with email ${email}`);
}

main()
  .catch((error) => {
    console.error("Failed to seed admin user", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
