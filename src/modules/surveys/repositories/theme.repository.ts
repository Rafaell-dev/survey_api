import { prisma } from '../../../lib/prisma';
import { UpdateThemeDTO } from '../dtos/theme.dto';

export class ThemeRepository {
  async findBySurveyId(surveyId: string) {
    return prisma.surveyTheme.findUnique({
      where: { surveyId }
    });
  }

  async upsert(surveyId: string, data: UpdateThemeDTO) {
    return prisma.surveyTheme.upsert({
      where: { surveyId },
      update: data,
      create: {
        surveyId,
        ...data
      }
    });
  }
}
