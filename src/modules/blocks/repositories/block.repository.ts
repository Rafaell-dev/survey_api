import { Block } from '@prisma/client';
import { prisma } from '../../../lib/prisma';

export interface CreateBlockInput {
  title?: string;
  description?: string;
  orderIndex: number;
  surveyId: string;
}

export interface UpdateBlockInput {
  title?: string;
  description?: string;
  orderIndex?: number;
}

export class PrismaBlockRepository {
  async create(data: CreateBlockInput) {
    return prisma.block.create({ data });
  }

  async findById(id: string) {
    return prisma.block.findUnique({
      where: { id },
      include: {
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
    return prisma.block.findMany({
      where: { surveyId },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        title: true,
        orderIndex: true
      }
    });
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
