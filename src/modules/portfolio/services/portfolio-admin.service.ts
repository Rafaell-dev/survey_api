import { prisma } from '../../../lib/prisma';
import { 
  UpdateProfileDto, CreateInterestDto, UpdateInterestDto,
  CreateEducationDto, UpdateEducationDto, CreateEventDto, UpdateEventDto,
  CreatePageDto, UpdatePageDto, CreateToolCategoryDto, UpdateToolCategoryDto,
  CreateToolDto, UpdateToolDto 
} from '../dtos/portfolio.schema';
import { AppError } from '../../../utils/AppError';

export const portfolioAdminService = {
  // ==========================================
  // PROFILE
  // ==========================================
  async getProfile(userId: string) {
    let profile = await prisma.portfolioProfile.findUnique({ where: { userId } });
    if (!profile) {
      // Create default
      profile = await prisma.portfolioProfile.create({
        data: {
          userId,
          name: 'Meu Nome',
          slug: 'meu-portfolio-' + Math.random().toString(36).substr(2, 5),
        }
      });
    }
    return profile;
  },

  async updateProfile(userId: string, data: UpdateProfileDto) {
    if (data.slug) {
      const exists = await prisma.portfolioProfile.findFirst({
        where: { slug: data.slug, userId: { not: userId } }
      });
      if (exists) {
        throw new AppError('Este slug já está em uso por outro usuário', 400);
      }
    }

    return prisma.portfolioProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        name: data.name || 'Meu Nome',
        slug: data.slug || 'meu-portfolio-' + Math.random().toString(36).substr(2, 5),
        ...data
      }
    });
  },

  // ==========================================
  // INTERESTS
  // ==========================================
  async listInterests(userId: string) {
    return prisma.portfolioInterest.findMany({ 
      where: { userId },
      orderBy: { orderIndex: 'asc' }
    });
  },

  async createInterest(userId: string, data: CreateInterestDto) {
    return prisma.portfolioInterest.create({ data: { ...data, userId } });
  },

  async updateInterest(userId: string, id: string, data: UpdateInterestDto) {
    return prisma.portfolioInterest.update({ where: { id, userId }, data });
  },

  async deleteInterest(userId: string, id: string) {
    return prisma.portfolioInterest.delete({ where: { id, userId } });
  },

  // ==========================================
  // EDUCATION
  // ==========================================
  async listEducations(userId: string) {
    return prisma.portfolioEducation.findMany({ 
      where: { userId },
      orderBy: [{ orderIndex: 'asc' }, { year: 'desc' }]
    });
  },

  async createEducation(userId: string, data: CreateEducationDto) {
    return prisma.portfolioEducation.create({ data: { ...data, userId } });
  },

  async updateEducation(userId: string, id: string, data: UpdateEducationDto) {
    return prisma.portfolioEducation.update({ where: { id, userId }, data });
  },

  async deleteEducation(userId: string, id: string) {
    return prisma.portfolioEducation.delete({ where: { id, userId } });
  },

  // ==========================================
  // EVENTS
  // ==========================================
  async listEvents(userId: string) {
    return prisma.portfolioEvent.findMany({ 
      where: { userId },
      orderBy: { date: 'desc' }
    });
  },

  async createEvent(userId: string, data: CreateEventDto) {
    return prisma.portfolioEvent.create({ data: { ...data, userId } });
  },

  async updateEvent(userId: string, id: string, data: UpdateEventDto) {
    return prisma.portfolioEvent.update({ where: { id, userId }, data });
  },

  async deleteEvent(userId: string, id: string) {
    return prisma.portfolioEvent.delete({ where: { id, userId } });
  },

  // ==========================================
  // PAGES
  // ==========================================
  async listPages(userId: string) {
    return prisma.portfolioPage.findMany({ where: { userId } });
  },

  async getPage(userId: string, slug: string) {
    return prisma.portfolioPage.findUnique({ where: { userId_slug: { userId, slug } } });
  },

  async createPage(userId: string, data: CreatePageDto) {
    return prisma.portfolioPage.create({ data: { ...data, userId } });
  },

  async updatePage(userId: string, id: string, data: UpdatePageDto) {
    return prisma.portfolioPage.update({ where: { id, userId }, data });
  },

  async deletePage(userId: string, id: string) {
    return prisma.portfolioPage.delete({ where: { id, userId } });
  },

  // ==========================================
  // TOOL CATEGORIES
  // ==========================================
  async listToolCategories(userId: string) {
    return prisma.portfolioToolCategory.findMany({ where: { userId } });
  },

  async createToolCategory(userId: string, data: CreateToolCategoryDto) {
    return prisma.portfolioToolCategory.create({ data: { ...data, userId } });
  },

  async updateToolCategory(userId: string, id: string, data: UpdateToolCategoryDto) {
    return prisma.portfolioToolCategory.update({ where: { id, userId }, data });
  },

  async deleteToolCategory(userId: string, id: string) {
    return prisma.portfolioToolCategory.delete({ where: { id, userId } });
  },

  // ==========================================
  // TOOLS
  // ==========================================
  async listTools(userId: string) {
    return prisma.portfolioTool.findMany({ 
      where: { userId },
      include: { categories: true }
    });
  },

  async createTool(userId: string, data: CreateToolDto) {
    const { categoryIds, ...toolData } = data;
    return prisma.portfolioTool.create({ 
      data: { 
        ...toolData, 
        userId,
        categories: categoryIds ? { connect: categoryIds.map(id => ({ id })) } : undefined
      },
      include: { categories: true }
    });
  },

  async updateTool(userId: string, id: string, data: UpdateToolDto) {
    const { categoryIds, ...toolData } = data;
    return prisma.portfolioTool.update({ 
      where: { id, userId }, 
      data: {
        ...toolData,
        categories: categoryIds ? { set: categoryIds.map(catId => ({ id: catId })) } : undefined
      },
      include: { categories: true }
    });
  },

  async deleteTool(userId: string, id: string) {
    return prisma.portfolioTool.delete({ where: { id, userId } });
  },

  // ==========================================
  // SURVEYS (Integração)
  // ==========================================
  async listSurveys(userId: string) {
    return prisma.survey.findMany({
      where: { 
        researcherId: userId,
        status: { not: 'ARCHIVED' }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        isHighlighted: true,
        publicSlug: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
  },

  async toggleSurveyHighlight(userId: string, surveyId: string, isHighlighted: boolean) {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId }
    });

    if (!survey || survey.researcherId !== userId) {
      throw new AppError('Pesquisa não encontrada', 404);
    }

    return prisma.survey.update({
      where: { id: surveyId },
      data: { isHighlighted },
      select: {
        id: true,
        isHighlighted: true,
      }
    });
  }
};
