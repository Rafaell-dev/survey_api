import { prisma } from '../src/lib/prisma';
import argon2 from 'argon2';

async function main() {
  // Apaga Respostas
  await prisma.answer.deleteMany();
  await prisma.blockTracking.deleteMany();
  await prisma.mediaInteraction.deleteMany();
  await prisma.surveyResponse.deleteMany();
  await prisma.participant.deleteMany();

  // Apaga Pesquisas e suas estruturas
  await prisma.block.deleteMany();
  await prisma.surveyTheme.deleteMany();
  await prisma.survey.deleteMany();

  // Não apagar a tabela 'User', mas garantir que existe um usuário de teste Admin
  const hashed = await argon2.hash('12345678');
  await prisma.user.upsert({
    where: { email: 'e2e@test.com' },
    update: { password: hashed, role: 'ADMIN', status: 'ACTIVE' },
    create: {
      name: 'Playwright E2E User',
      email: 'e2e@test.com',
      password: hashed,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  console.log('✔ Banco de dados limpo e usuário e2e@test.com configurado.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
