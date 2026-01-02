import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = "media.pro80@hotmail.com";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      role: true,
    },
  });

  if (!user) {
    console.log(`User with email ${email} not found.`);
    return;
  }

  console.log(`User ${user.email} has role: ${user.role}`);
}

main()
  .catch((error) => {
    console.error("Failed to check admin user", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
