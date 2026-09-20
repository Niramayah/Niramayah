import "dotenv/config";
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create or update Super Admin User
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  const plainPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!adminEmail || !plainPassword) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be defined in the .env file');
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Super Admin',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      credits: 999999,
      isUnlimitedCredits: true,
      isVerified: true,
    },
    create: {
      email: adminEmail,
      name: 'Super Admin',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      credits: 999999,
      isUnlimitedCredits: true,
      isVerified: true,
    },
  });

  console.log('Super Admin user created/updated:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
