import { prisma } from '../../../lib/prisma';
import { ResponseStatus, MediaInteractionType } from '@prisma/client';

export interface SaveAnswerData {
  textValue?: string;
  numericValue?: number;
  selectedOptionId?: string;
  selectedOptionsIds?: string[];
  mediaId?: string;
  timeSpentMs: number;
}

export class PublicSurveyRepository {
  private filterActiveMedias(survey: any) {
    if (!survey || !survey.blocks) return survey;
    for (const block of survey.blocks) {
      if (!block.questions) continue;
      for (const question of block.questions) {
        if (!question.medias || question.medias.length === 0) continue;
        question.medias = question.medias.map(({ _count, ...rest }: any) => rest);
      }
    }
    return survey;
  }

  private async processSurveyForPublic(survey: any) {
    if (!survey || !survey.blocks) return survey;

    // 1. Filtra mídias ativas
    this.filterActiveMedias(survey);

    // 2. Calcula limite e respostas de cada bloco
    const enrichedBlocks = await Promise.all(
      survey.blocks.map(async (block: any) => {
        let count = 0;
        if (block.responseLimit !== null && block.responseLimit !== undefined) {
          count = await prisma.surveyResponse.count({
            where: {
              surveyId: survey.id,
              OR: [
                { answers: { some: { question: { blockId: block.id } } } },
                { blockTrackings: { some: { blockId: block.id } } }
              ]
            }
          });
        }

        return {
          ...block,
          responsesCount: count,
          isLimitReached: Boolean(
            block.responseLimit !== null &&
            block.responseLimit !== undefined &&
            count >= block.responseLimit
          )
        };
      })
    );

    survey.blocks = enrichedBlocks;
    return survey;
  }

  async findBySlug(slug: string) {
    const survey = await prisma.survey.findUnique({
      where: { publicSlug: slug },
      include: {
        theme: true,
        blocks: {
          orderBy: { orderIndex: 'asc' },
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: {
                options: { orderBy: { orderIndex: 'asc' } },
                scaleOptions: { orderBy: { orderIndex: 'asc' } },
                rules: true,
                medias: {
                  orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
                  include: {
                    _count: {
                      select: { answers: true }
                    }
                  }
                },
              }
            }
          }
        }
      }
    });

    return this.processSurveyForPublic(survey);
  }

  async findPublishedSurveyById(id: string) {
    const survey = await prisma.survey.findUnique({
      where: { id },
      include: {
        theme: true,
        blocks: {
          orderBy: { orderIndex: 'asc' },
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: {
                options: { orderBy: { orderIndex: 'asc' } },
                scaleOptions: { orderBy: { orderIndex: 'asc' } },
                rules: true,
                medias: {
                  orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
                  include: {
                    _count: {
                      select: { answers: true }
                    }
                  }
                },
              }
            }
          }
        }
      }
    });

    return this.processSurveyForPublic(survey);
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
    let mediaIdToSave = data.mediaId;
    if (!mediaIdToSave) {
      const questionMedias = await prisma.media.findMany({
        where: { questionId },
        orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }]
      });
      if (questionMedias.length > 0) {
        mediaIdToSave = questionMedias[0].id;
      }
    }

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
          mediaId: mediaIdToSave ?? existing.mediaId,
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
        mediaId: mediaIdToSave,
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

  async interruptResponse(responseId: string) {
    return prisma.surveyResponse.update({
      where: { id: responseId },
      data: { isInterrupted: true }
    });
  }
}
