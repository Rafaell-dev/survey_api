import { prisma } from '../../../lib/prisma';
import { SyncSurveyDto } from '../dtos/survey.schema';

export class SyncSurveyService {
  async execute(surveyId: string, data: SyncSurveyDto, researcherId: string) {
    // Verifica autorização
    const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey) {
      const err = new Error('Survey não encontrado');
      (err as any).status = 404;
      throw err;
    }

    if (survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado');
      (err as any).status = 403;
      throw err;
    }

    if (survey.status === 'PUBLISHED' && survey.acceptingResponses === true) {
      const err = new Error('Não é possível editar a estrutura de um formulário publicado que está aceitando respostas. Pause o recebimento de respostas nas configurações primeiro.');
      (err as any).status = 409;
      throw err;
    }

    // Transação de sincronização da árvore
    await prisma.$transaction(async (tx) => {
      // 1. Deleções (bottom-up é seguro, mas onDelete cascade tb resolve. Fazemos explícito por clareza)
      if (data.deletedOptionIds.length > 0) {
        await tx.questionOption.deleteMany({ where: { id: { in: data.deletedOptionIds } } });
      }
      if (data.deletedQuestionIds.length > 0) {
        await tx.question.deleteMany({ where: { id: { in: data.deletedQuestionIds } } });
      }
      if (data.deletedBlockIds.length > 0) {
        await tx.block.deleteMany({ where: { id: { in: data.deletedBlockIds } } });
      }
      if (data.deletedScaleOptionIds && data.deletedScaleOptionIds.length > 0) {
        await tx.questionScaleOption.deleteMany({ where: { id: { in: data.deletedScaleOptionIds } } });
      }

      // 2. Upserts
      const blockIdMap = new Map<string, string>();

      for (const block of data.blocks) {
        let actualBlockId = block.id;

        if (block.isNew) {
          const created = await tx.block.create({
            data: {
              surveyId,
              title: block.title,
              description: block.description,
              orderIndex: block.orderIndex,
              responseLimit: block.responseLimit ?? null,
              showOnlyOnFallback: block.showOnlyOnFallback ?? false
            }
          });
          actualBlockId = created.id;
          blockIdMap.set(block.id, created.id);
        } else {
          await tx.block.update({
            where: { id: block.id },
            data: {
              title: block.title,
              description: block.description,
              orderIndex: block.orderIndex,
              responseLimit: block.responseLimit ?? null,
              showOnlyOnFallback: block.showOnlyOnFallback ?? false
            }
          });
          blockIdMap.set(block.id, block.id);
        }

        for (const question of block.questions) {
          let actualQuestionId = question.id;

          if (question.isNew) {
            const created = await tx.question.create({
              data: {
                blockId: actualBlockId,
                title: question.title,
                description: question.description,
                type: question.type,
                isRequired: question.isRequired,
                orderIndex: question.orderIndex,
                scaleStart: question.scaleStart,
                scaleEnd: question.scaleEnd,
                scaleVisualType: question.scaleVisualType
              }
            });
            actualQuestionId = created.id;
          } else {
            await tx.question.update({
              where: { id: question.id },
              data: {
                blockId: actualBlockId, // em caso de troca de bloco (arrastar para outro bloco)
                title: question.title,
                description: question.description,
                type: question.type,
                isRequired: question.isRequired,
                orderIndex: question.orderIndex,
                scaleStart: question.scaleStart,
                scaleEnd: question.scaleEnd,
                scaleVisualType: question.scaleVisualType
              }
            });
          }

          for (const option of question.options) {
            if (option.isNew) {
              await tx.questionOption.create({
                data: {
                  questionId: actualQuestionId,
                  label: option.label,
                  value: option.value,
                  orderIndex: option.orderIndex
                }
              });
            } else {
              await tx.questionOption.update({
                where: { id: option.id },
                data: {
                  questionId: actualQuestionId,
                  label: option.label,
                  value: option.value,
                  orderIndex: option.orderIndex
                }
              });
            }
          }

          if (question.scaleOptions) {
            for (const sOpt of question.scaleOptions) {
              if (sOpt.isNew) {
                await tx.questionScaleOption.create({
                  data: {
                    questionId: actualQuestionId,
                    label: sOpt.label,
                    numericValue: sOpt.numericValue,
                    emoji: sOpt.emoji,
                    icon: sOpt.icon,
                    orderIndex: sOpt.orderIndex
                  }
                });
              } else {
                await tx.questionScaleOption.update({
                  where: { id: sOpt.id },
                  data: {
                    questionId: actualQuestionId,
                    label: sOpt.label,
                    numericValue: sOpt.numericValue,
                    emoji: sOpt.emoji,
                    icon: sOpt.icon,
                    orderIndex: sOpt.orderIndex
                  }
                });
              }
            }
          }
        }
      }

      // Atualiza fallbackBlockId para todos os blocos (garantindo que referências cruzadas ou a novos blocos funcionem)
      for (const block of data.blocks) {
        const actualBlockId = blockIdMap.get(block.id) || block.id;
        const targetFallbackId = block.fallbackBlockId
          ? (blockIdMap.get(block.fallbackBlockId) || block.fallbackBlockId)
          : null;

        if (block.fallbackBlockId !== undefined) {
          await tx.block.update({
            where: { id: actualBlockId },
            data: { fallbackBlockId: targetFallbackId }
          });
        }
      }
    });

    // Retorna a árvore atualizada, ordenadinha
    const tree = await prisma.block.findMany({
      where: { surveyId },
      orderBy: { orderIndex: 'asc' },
      include: {
        fallbackBlock: {
          select: { id: true, title: true, orderIndex: true }
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: {
              orderBy: { orderIndex: 'asc' }
            },
            scaleOptions: {
              orderBy: { numericValue: 'asc' }
            }
          }
        }
      }
    });

    const enrichedTree = await Promise.all(
      tree.map(async (block) => {
        const count = await prisma.surveyResponse.count({
          where: {
            surveyId,
            OR: [
              { answers: { some: { question: { blockId: block.id } } } },
              { blockTrackings: { some: { blockId: block.id } } }
            ]
          }
        });
        return {
          ...block,
          responsesCount: count
        };
      })
    );

    return enrichedTree;
  }
}
