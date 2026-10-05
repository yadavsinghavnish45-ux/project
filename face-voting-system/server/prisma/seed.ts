import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await prisma.admin.findUnique({
    where: { username: adminUsername },
  });

  if (existingAdmin) {
    console.log('Admin already exists:', adminUsername);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.admin.create({
    data: {
      username: adminUsername,
      passwordHash,
    },
  });

  console.log('Admin created:', admin.username);
  console.log('Password:', adminPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });