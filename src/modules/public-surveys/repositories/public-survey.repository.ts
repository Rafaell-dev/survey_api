import { prisma } from '../../../lib/prisma';
import { ResponseStatus } from '@prisma/client';

export class PublicSurveyRepository {
  async findPublishedSurveyById(id: string) {
    return prisma.survey.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: {
                options: { orderBy: { orderIndex: 'asc' } },
                scaleOptions: { orderBy: { orderIndex: 'asc' } },
                rules: true,
                medias: true,
              }
            }
          }
        }
      }
    });
  }

  async createParticipant(data: { name?: string, email?: string, phone?: string }) {
    return prisma.participant.create({
      data: {
        name: data.name || null,
        email: data.email || null,
        phone: data.phone || null
      }
    });
  }

  async findResponseByEmailOrPhone(surveyId: string, email?: string, phone?: string) {
    if (!email && !phone) return null;
    return prisma.surveyResponse.findFirst({
      where: {
        surveyId,
        participant: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : [])
          ]
        }
      }
    });
  }

  async createSurveyResponse(participantId: string, surveyId: string) {
    return prisma.surveyResponse.create({
      data: {
        participantId,
        surveyId,
        status: ResponseStatus.IN_PROGRESS
      }
    });
  }

  async findResponseById(responseId: string) {
    return prisma.surveyResponse.findUnique({
      where: { id: responseId },
      include: {
        answers: true,
        survey: {
          include: {
            blocks: {
              orderBy: { orderIndex: 'asc' },
              include: {
                questions: {
                  orderBy: { orderIndex: 'asc' },
                  include: {
                    options: { orderBy: { orderIndex: 'asc' } },
                    scaleOptions: { orderBy: { orderIndex: 'asc' } },
                    rules: true,
                    medias: true,
                  }
                }
              }
            }
          }
        }
      }
    });
  }
}
