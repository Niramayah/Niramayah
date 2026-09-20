const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const permissions = await prisma.userPermission.findMany({
    select: { permissionKey: true }
  });
  
  const keys = [...new Set(permissions.map(p => p.permissionKey))];
  console.log('Current permission keys in database:', keys);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
