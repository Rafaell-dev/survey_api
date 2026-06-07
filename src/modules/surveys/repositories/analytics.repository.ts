import { prisma } from '../../../lib/prisma';
import { ResponseStatus } from '@prisma/client';

export class AnalyticsRepository {
  async findSurveyById(id: string) {
    return prisma.survey.findUnique({
      where: { id }
    });
  }

  async findSurveyOverview(surveyId: string) {
    // Busca todas as respostas e participantes associados
    return prisma.surveyResponse.findMany({
      where: { surveyId },
      include: {
        participant: true
      }
    });
  }

  async findSurveyQuestionsAnalytics(surveyId: string) {
    // Busca a estrutura da survey e as respostas válidas (COMPLETED)
    return prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: {
                options: true,
                answers: {
                  where: {
                    response: {
                      status: ResponseStatus.COMPLETED
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  async findSurveyNavigationAnalytics(surveyId: string) {
    // Busca a estrutura da survey e seus trackings em respostas válidas ou todas?
    // Geralmente analytics de tempo e views incluem IN_PROGRESS, mas para precisão de navegação, pode ser útil
    // Filtraremos para respostas em andamento e concluídas
    return prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
          include: {
            trackings: {
              where: {
                response: {
                  surveyId
                }
              }
            }
          }
        }
      }
    });
  }

  async findSurveyMediaAnalytics(surveyId: string) {
    // Busca mídias do survey e suas interações
    return prisma.media.findMany({
      where: {
        question: {
          block: {
            surveyId
          }
        }
      },
      include: {
        interactions: {
          where: {
            response: {
              surveyId
            }
          }
        }
      }
    });
  }
}
