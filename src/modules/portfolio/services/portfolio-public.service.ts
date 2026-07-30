import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../utils/AppError';

export const portfolioPublicService = {
  async getPortfolioData(slug: string) {
    const profile = await prisma.portfolioProfile.findUnique({
      where: { slug }
    });

    if (!profile) {
      throw new AppError('Portfólio não encontrado', 404);
    }

    const userId = profile.userId;

    const [interests, educations, events, pages, categories, tools, surveys] = await Promise.all([
      prisma.portfolioInterest.findMany({ where: { userId } }),
      prisma.portfolioEducation.findMany({ where: { userId }, orderBy: { year: 'desc' } }),
      prisma.portfolioEvent.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
      prisma.portfolioPage.findMany({ where: { userId } }),
      prisma.portfolioToolCategory.findMany({ where: { userId } }),
      prisma.portfolioTool.findMany({ where: { userId }, include: { categories: true } }),
      prisma.survey.findMany({ 
        where: { researcherId: userId, isHighlighted: true, status: 'PUBLISHED' },
        select: { id: true, title: true, description: true, publicSlug: true }
      }),
    ]);

    return {
      profile,
      interests,
      educations,
      events,
      pages,
      categories,
      tools,
      surveys
    };
  }
};
