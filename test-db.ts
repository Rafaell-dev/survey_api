import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const users = await prisma.user.count();
    console.log('USERS COUNT:', users);
    
    const portfolios = await prisma.portfolioProfile.count();
    console.log('PORTFOLIOS COUNT:', portfolios);
  } catch (e) {
    console.error('ERROR:', e);
  }
}
main().finally(() => prisma.$disconnect());
