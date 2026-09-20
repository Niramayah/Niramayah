import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkPlans() {
  const plans = await prisma.subscriptionPlan.findMany();
  console.log('Current Subscription Plans:');
  plans.forEach(p => {
    console.log(`- ${p.name}: ${p.credits} credits, Price: ${p.price}`);
  });
}

checkPlans()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
