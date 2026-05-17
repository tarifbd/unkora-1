/**
 * Run once to upsert the admin user with a known password.
 * Usage: DATABASE_URL="..." npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/reset-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@unkora.com';
  const password = 'Admin@123456';

  const hash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, role: 'SUPER_ADMIN', status: 'ACTIVE', emailVerifiedAt: new Date() },
    create: {
      email,
      passwordHash: hash,
      firstName: 'UNKORA',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`✅ Admin user ready: ${user.email} (id: ${user.id})`);
  console.log(`   Password: ${password}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
