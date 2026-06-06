import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';

export class PrismaQuestionRepository {
  async create(data: Prisma.QuestionUncheckedCreateInput) {
    return prisma.question.create({ data });
  }

  async findById(id: string) {
    return prisma.question.findUnique({
      where: { id },
      include: {
        answers: { select: { id: true }, take: 1 },
        block: {
          include: {
            survey: {
              include: {
                responses: { select: { id: true }, take: 1 }
              }
            }
          }
        }
      }
    });
  }

  async findManyByBlockId(blockId: string) {
    return prisma.question.findMany({
      where: { blockId },
      orderBy: { orderIndex: 'asc' }
    });
  }

  async findLastQuestionByBlockId(blockId: string) {
    return prisma.question.findFirst({
      where: { blockId },
      orderBy: { orderIndex: 'desc' }
    });
  }

  async update(id: string, data: Prisma.QuestionUncheckedUpdateInput) {
    return prisma.question.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    await prisma.question.delete({ where: { id } });
  }

  async updateMany(data: { id: string, orderIndex: number }[]) {
    await prisma.$transaction(
      data.map(item => prisma.question.update({
        where: { id: item.id },
        data: { orderIndex: item.orderIndex }
      }))
    );
  }

  async shiftOrderIndicesDown(blockId: string, fromOrderIndex: number) {
    await prisma.question.updateMany({
      where: {
        blockId,
        orderIndex: { gt: fromOrderIndex }
      },
      data: {
        orderIndex: { decrement: 1 }
      }
    });
  }
}
