import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';

export class PrismaQuestionOptionRepository {
  async create(data: Prisma.QuestionOptionUncheckedCreateInput) {
    return prisma.questionOption.create({ data });
  }

  async findById(id: string) {
    return prisma.questionOption.findUnique({
      where: { id },
      include: {
        answers: { take: 1 },
        question: {
          include: {
            answers: { take: 1 },
            block: { include: { survey: true } }
          }
        }
      }
    });
  }

  async findByQuestionId(questionId: string) {
    return prisma.questionOption.findMany({
      where: { questionId },
      orderBy: { orderIndex: 'asc' }
    });
  }

  async update(id: string, data: Prisma.QuestionOptionUpdateInput) {
    return prisma.questionOption.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.questionOption.delete({
      where: { id }
    });
  }

  async countByQuestion(questionId: string) {
    return prisma.questionOption.count({
      where: { questionId }
    });
  }

  async existsValueInQuestion(questionId: string, value: number, excludeOptionId?: string) {
    const where: any = { questionId, value };
    if (excludeOptionId) {
      where.id = { not: excludeOptionId };
    }
    const count = await prisma.questionOption.count({ where });
    return count > 0;
  }

  async updateMany(options: { id: string; orderIndex: number }[]) {
    await prisma.$transaction(
      options.map(o => 
        prisma.questionOption.update({
          where: { id: o.id },
          data: { orderIndex: o.orderIndex }
        })
      )
    );
  }

  async shiftOrderIndicesDown(questionId: string, deletedOrderIndex: number) {
    await prisma.questionOption.updateMany({
      where: {
        questionId,
        orderIndex: { gt: deletedOrderIndex }
      },
      data: {
        orderIndex: { decrement: 1 }
      }
    });
  }
}
