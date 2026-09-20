const { PrismaClient, MemberStatus, Role } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating Founding Four Emails...');

  const leaders = [
    {
      email: 'abhirupc@niramayahhealthtech.com',
      name: 'Abhirup Chattopadhyay',
      coreRoleTitle: 'Chief Visionary Officer & Research Lead',
      memberStatus: 'LEADER',
      isCoreMember: true,
      role: 'ADMIN'
    },
    {
      email: 'bikramdas@niramayahhealthtech.com',
      name: 'Bikram Das',
      coreRoleTitle: 'Chief AI Architect & Financial Controller',
      memberStatus: 'LEADER',
      isCoreMember: true,
      role: 'ADMIN'
    },
    {
      email: 'arnabghorai@niramayahhealthtech.com',
      name: 'Arnab Ghorai',
      coreRoleTitle: 'Chief Technology Officer & Lead Systems Engineer',
      memberStatus: 'LEADER',
      isCoreMember: true,
      role: 'SUPER_ADMIN'
    },
    {
      email: 'riyapal@niramayahhealthtech.com',
      name: 'Riya Pal',
      coreRoleTitle: 'Head of Strategy, Communications & Quality Audit',
      memberStatus: 'LEADER',
      isCoreMember: true,
      role: 'ADMIN'
    }
  ];

  for (const leader of leaders) {
    await prisma.user.upsert({
      where: { email: leader.email },
      update: {
        name: leader.name,
        coreRoleTitle: leader.coreRoleTitle,
        memberStatus: leader.memberStatus,
        isCoreMember: leader.isCoreMember,
        role: leader.role
      },
      create: {
        ...leader,
        password: 'temporary_password_123'
      }
    });
  }

  // Remove old placeholders if they exist
  const oldEmails = ['abhirup@niramayah.com', 'bikram@niramayah.com', 'arnab@niramayah.com', 'riya@niramayah.com'];
  await prisma.user.deleteMany({
    where: {
      email: { in: oldEmails }
    }
  });

  console.log('Founding Four updated and placeholders purged successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
