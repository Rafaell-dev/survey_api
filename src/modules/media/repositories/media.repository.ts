import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';

export class PrismaMediaRepository {
  async create(data: Prisma.MediaUncheckedCreateInput) {
    return prisma.media.create({ data });
  }

  async findById(id: string) {
    return prisma.media.findUnique({
      where: { id },
      include: {
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
    return prisma.media.findMany({
      where: { questionId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async delete(id: string) {
    return prisma.media.delete({
      where: { id }
    });
  }
}
