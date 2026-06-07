import { prisma } from '../../../lib/prisma';
import { ResponseStatus, MediaInteractionType } from '@prisma/client';

export interface SaveAnswerData {
  textValue?: string;
  numericValue?: number;
  selectedOptionId?: string;
  selectedOptionsIds?: string[];
  timeSpentMs: number;
}

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

  async findQuestionById(id: string) {
    return prisma.question.findUnique({
      where: { id }
    });
  }

  async saveAnswer(responseId: string, questionId: string, data: SaveAnswerData) {
    const existing = await prisma.answer.findFirst({
      where: { responseId, questionId }
    });

    if (existing) {
      return prisma.answer.update({
        where: { id: existing.id },
        data: {
          textValue: data.textValue ?? null,
          numericValue: data.numericValue ?? null,
          selectedOptionId: data.selectedOptionId ?? null,
          selectedOptionsIds: data.selectedOptionsIds ?? [],
          timeSpentMs: data.timeSpentMs
        }
      });
    }

    return prisma.answer.create({
      data: {
        responseId,
        questionId,
        textValue: data.textValue,
        numericValue: data.numericValue,
        selectedOptionId: data.selectedOptionId,
        selectedOptionsIds: data.selectedOptionsIds ?? [],
        timeSpentMs: data.timeSpentMs
      }
    });
  }

  async completeResponse(responseId: string, totalTimeMs: number) {
    return prisma.surveyResponse.update({
      where: { id: responseId },
      data: {
        status: ResponseStatus.COMPLETED,
        finishedAt: new Date(),
        totalTimeMs
      }
    });
  }

  async saveBlockTrackings(responseId: string, blocks: { blockId: string; orderIndex: number; timeSpentMs: number }[]) {
    const now = new Date();
    
    return prisma.$transaction(async (tx) => {
      await tx.blockTracking.deleteMany({
        where: { responseId }
      });

      const created = await tx.blockTracking.createMany({
        data: blocks.map(b => ({
          responseId,
          blockId: b.blockId,
          orderIndex: b.orderIndex,
          timeSpentMs: b.timeSpentMs,
          enteredAt: now,
          leftAt: now
        }))
      });

      return created.count;
    });
  }

  async saveMediaInteractions(responseId: string, interactions: { mediaId: string; interactionType: MediaInteractionType; timeOffsetMs?: number }[]) {
    const created = await prisma.mediaInteraction.createMany({
      data: interactions.map(i => ({
        responseId,
        mediaId: i.mediaId,
        interactionType: i.interactionType,
        timeOffsetMs: i.timeOffsetMs ?? null
      }))
    });

    return created.count;
  }
}
