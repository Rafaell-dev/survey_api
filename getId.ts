import { prisma } from './src/lib/prisma';
prisma.survey.findFirst().then(s => console.log(s?.id)).finally(()=>prisma.$disconnect());
