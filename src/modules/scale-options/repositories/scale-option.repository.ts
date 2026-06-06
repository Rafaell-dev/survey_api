import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';

export class PrismaScaleOptionRepository {
  async createMany(data: Prisma.QuestionScaleOptionCreateManyInput[], tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    await db.questionScaleOption.createMany({
      data
    });
  }

  async deleteManyByQuestionId(questionId: string, tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    await db.questionScaleOption.deleteMany({
      where: { questionId }
    });
  }

  async findByQuestionId(questionId: string) {
    return prisma.questionScaleOption.findMany({
      where: { questionId },
      orderBy: { orderIndex: 'asc' }
    });
  }
}
