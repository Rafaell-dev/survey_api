import { prisma } from '../../../lib/prisma';
import { ResponseStatus } from '@prisma/client';

export class ExportRepository {
  async findSurveyExportData(surveyId: string) {
    return prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: {
                options: true
              }
            }
          }
        },
        responses: {
          where: { status: ResponseStatus.COMPLETED },
          include: {
            participant: true,
            answers: true
          }
        }
      }
    });
  }
}
