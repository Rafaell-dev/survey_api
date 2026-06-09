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

      // 2. Upserts
      for (const block of data.blocks) {
        let actualBlockId = block.id;

        if (block.isNew) {
          const created = await tx.block.create({
            data: {
              surveyId,
              title: block.title,
              description: block.description,
              orderIndex: block.orderIndex
            }
          });
          actualBlockId = created.id;
        } else {
          await tx.block.update({
            where: { id: block.id },
            data: {
              title: block.title,
              description: block.description,
              orderIndex: block.orderIndex
            }
          });
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
        }
      }
    });

    // Retorna a árvore atualizada, ordenadinha
    const tree = await prisma.block.findMany({
      where: { surveyId },
      orderBy: { orderIndex: 'asc' },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    });

    return tree;
  }
}
