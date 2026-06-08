import { prisma } from '../../../lib/prisma';

export class PublicLinkRepository {
  async findSurveyById(id: string) {
    return prisma.survey.findUnique({
      where: { id }
    });
  }

  async findSurveyBySlug(publicSlug: string) {
    return prisma.survey.findUnique({
      where: { publicSlug }
    });
  }

  async updatePublicLink(id: string, publicSlug: string | null, publicLinkActive: boolean) {
    return prisma.survey.update({
      where: { id },
      data: { publicSlug, publicLinkActive }
    });
  }

  async updatePublicLinkStatus(id: string, publicLinkActive: boolean) {
    return prisma.survey.update({
      where: { id },
      data: { publicLinkActive }
    });
  }
}
