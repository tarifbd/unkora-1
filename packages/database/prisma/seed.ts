import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const superAdminHash = await argon2.hash('Admin@123456');

  await prisma.user.upsert({
    where: { email: 'admin@unkora.com' },
    update: {},
    create: {
      email: 'admin@unkora.com',
      passwordHash: superAdminHash,
      firstName: 'UNKORA',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
