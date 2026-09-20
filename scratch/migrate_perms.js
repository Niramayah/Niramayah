const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const legacyMap = {
    'BLOG_WRITE': 'blogWrite',
    'blog_write': 'blogWrite',
    'blogWriter': 'blogWrite',
    'BLOG_PUBLISH': 'blogPublish',
    'blog_publish': 'blogPublish',
    'blogPublisher': 'blogPublish',
    'AI_TEST_ACCESS': 'aiTestAccess',
    'AI_TRAINING_ACCESS': 'aiTrainingAccess',
    'AI_QUESTION_MANAGE': 'aiQuestionManage',
    'NEWS_WRITE': 'newsWrite',
    'NEWS_PUBLISH': 'newsPublish',
    'SUPPORT_TICKET_HANDLE': 'supportTicketHandle',
    'CONTENT_MANAGE': 'contentManage',
    'VIEW_AUDIT_LIMITED': 'viewAuditLimited'
  };

  const permissions = await prisma.userPermission.findMany();
  
  console.log(`Checking ${permissions.length} permission entries...`);

  for (const p of permissions) {
    const newKey = legacyMap[p.permissionKey];
    if (newKey) {
      console.log(`Migrating key: ${p.permissionKey} -> ${newKey} for user ${p.userId}`);
      
      try {
        // Try to update existing camelCase entry if it exists, or update the current one
        const existing = await prisma.userPermission.findUnique({
          where: {
            userId_permissionKey: {
              userId: p.userId,
              permissionKey: newKey
            }
          }
        });

        if (existing) {
          // If a camelCase entry already exists, merge the enabled status (true takes precedence)
          await prisma.userPermission.update({
            where: { id: existing.id },
            data: { enabled: existing.enabled || p.enabled }
          });
          // Delete the old legacy entry
          await prisma.userPermission.delete({ where: { id: p.id } });
        } else {
          // Just rename the key
          await prisma.userPermission.update({
            where: { id: p.id },
            data: { permissionKey: newKey }
          });
        }
      } catch (err) {
        console.error(`Failed to migrate ${p.permissionKey}:`, err.message);
      }
    }
  }

  console.log('Migration complete.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
