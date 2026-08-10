import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { CreateSurveyCategoryDTO, UpdateSurveyCategoryDTO } from './survey-category.schema';

export const surveyCategoryService = {
  async listCategories(userId: string) {
    const categories = await prisma.surveyCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { surveys: true }
        }
      }
    });

    return categories;
  },

  async createCategory(userId: string, data: CreateSurveyCategoryDTO) {
    const count = await prisma.surveyCategory.count({ where: { userId } });
    if (count >= 5) {
      throw new AppError('Você atingiu o limite máximo de 5 categorias cadastradas.', 400);
    }

    const nameTrimmed = data.name.trim();

    const existing = await prisma.surveyCategory.findFirst({
      where: { userId, name: { equals: nameTrimmed, mode: 'insensitive' } }
    });

    if (existing) {
      throw new AppError('Já existe uma categoria com este nome', 400);
    }

    return prisma.surveyCategory.create({
      data: {
        name: nameTrimmed,
        userId,
      }
    });
  },

  async updateCategory(userId: string, id: string, data: UpdateSurveyCategoryDTO) {
    const category = await prisma.surveyCategory.findUnique({
      where: { id }
    });

    if (!category || category.userId !== userId) {
      throw new AppError('Categoria não encontrada', 404);
    }

    const nameTrimmed = data.name.trim();

    const existing = await prisma.surveyCategory.findFirst({
      where: {
        userId,
        name: { equals: nameTrimmed, mode: 'insensitive' },
        NOT: { id }
      }
    });

    if (existing) {
      throw new AppError('Já existe outra categoria com este nome', 400);
    }

    return prisma.surveyCategory.update({
      where: { id },
      data: { name: nameTrimmed }
    });
  },

  async deleteCategory(userId: string, id: string) {
    const category = await prisma.surveyCategory.findUnique({
      where: { id }
    });

    if (!category || category.userId !== userId) {
      throw new AppError('Categoria não encontrada', 404);
    }

    return prisma.surveyCategory.delete({
      where: { id }
    });
  }
};
