import { Block } from '@prisma/client';
import { prisma } from '../../../lib/prisma';

export interface CreateBlockInput {
  title?: string;
  description?: string;
  orderIndex: number;
  surveyId: string;
  responseLimit?: number | null;
  fallbackBlockId?: string | null;
  showOnlyOnFallback?: boolean;
}

export interface UpdateBlockInput {
  title?: string;
  description?: string;
  orderIndex?: number;
  responseLimit?: number | null;
  fallbackBlockId?: string | null;
  showOnlyOnFallback?: boolean;
}

export class PrismaBlockRepository {
  async create(data: CreateBlockInput) {
    return prisma.block.create({ data });
  }

  async findById(id: string) {
    return prisma.block.findUnique({
      where: { id },
      include: {
        fallbackBlock: { select: { id: true, title: true, orderIndex: true } },
        rulesTargeted: { select: { id: true } },
        survey: {
          include: {
            responses: { take: 1, select: { id: true } }
          }
        }
      }
    });
  }

  async findManyBySurveyId(surveyId: string) {
    const blocks = await prisma.block.findMany({
      where: { surveyId },
      orderBy: { orderIndex: 'asc' },
      include: {
        fallbackBlock: { select: { id: true, title: true, orderIndex: true } }
      }
    });

    const enriched = await Promise.all(
      blocks.map(async (block) => {
        const count = await prisma.surveyResponse.count({
          where: {
            surveyId,
            OR: [
              { answers: { some: { question: { blockId: block.id } } } },
              { blockTrackings: { some: { blockId: block.id } } }
            ]
          }
        });
        return {
          ...block,
          responsesCount: count
        };
      })
    );

    return enriched;
  }

  async findLastBlockBySurveyId(surveyId: string) {
    return prisma.block.findFirst({
      where: { surveyId },
      orderBy: { orderIndex: 'desc' }
    });
  }

  async update(id: string, data: UpdateBlockInput) {
    return prisma.block.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    await prisma.block.delete({
      where: { id }
    });
  }

  async updateMany(data: { id: string, orderIndex: number }[]) {
    await prisma.$transaction(
      data.map(item => 
        prisma.block.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex }
        })
      )
    );
  }

  async shiftOrderIndicesDown(surveyId: string, fromOrderIndex: number) {
    await prisma.block.updateMany({
      where: {
        surveyId,
        orderIndex: { gt: fromOrderIndex }
      },
      data: {
        orderIndex: { decrement: 1 }
      }
    });
  }
}
