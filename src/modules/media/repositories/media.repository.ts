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
    const medias = await prisma.media.findMany({
      where: { questionId },
      include: {
        _count: {
          select: { answers: true }
        }
      },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }]
    });

    return medias.map(m => ({
      ...m,
      answersCount: m._count.answers
    }));
  }

  async update(id: string, data: { orderIndex?: number; responseLimit?: number | null }) {
    return prisma.media.update({
      where: { id },
      data
    });
  }

  async reorder(questionId: string, mediaIds: string[]) {
    return prisma.$transaction(
      mediaIds.map((id, index) =>
        prisma.media.update({
          where: { id, questionId },
          data: { orderIndex: index }
        })
      )
    );
  }

  async delete(id: string) {
    return prisma.media.delete({
      where: { id }
    });
  }
}

