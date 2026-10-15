import { prisma } from '../../../lib/prisma';

export class DuplicateSurveyService {
  async execute(sourceSurveyId: string, researcherId: string) {
    const source = await prisma.survey.findFirst({
      where: {
        id: sourceSurveyId,
        researcherId
      },
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
                medias: { orderBy: { orderIndex: 'asc' } },
                rules: true
              }
            }
          }
        }
      }
    });

    if (!source) {
      const err = new Error('Formulário não encontrado');
      (err as any).status = 404;
      throw err;
    }

    return prisma.$transaction(async (tx) => {
      // 1. Cria o novo Survey com status DRAFT
      const newSurvey = await tx.survey.create({
        data: {
          title: `${source.title} (Cópia)`,
          description: source.description,
          instructions: source.instructions,
          status: 'DRAFT',
          publicSlug: null,
          publicLinkActive: false,
          isHighlighted: false,
          participantIdentificationType: source.participantIdentificationType,
          allowMultipleResponses: source.allowMultipleResponses,
          acceptingResponses: source.acceptingResponses,
          categoryId: source.categoryId,
          researcherId
        }
      });

      // 2. Duplica o tema, se houver
      if (source.theme) {
        await tx.surveyTheme.create({
          data: {
            surveyId: newSurvey.id,
            primaryColor: source.theme.primaryColor,
            backgroundColor: source.theme.backgroundColor,
            textColor: source.theme.textColor,
            buttonColor: source.theme.buttonColor,
            fontFamily: source.theme.fontFamily,
            headerImage: source.theme.headerImage,
            layout: source.theme.layout
          }
        });
      }

      // Mapeamento de IDs antigos para novos IDs
      const blockIdMap = new Map<string, string>();
      const questionIdMap = new Map<string, string>();
      const optionIdMap = new Map<string, string>();

      // 3. Duplica todos os blocos e suas questões
      for (const block of source.blocks) {
        const newBlock = await tx.block.create({
          data: {
            surveyId: newSurvey.id,
            title: block.title,
            description: block.description,
            orderIndex: block.orderIndex,
            responseLimit: block.responseLimit,
            showOnlyOnFallback: block.showOnlyOnFallback,
            fallbackBlockId: null // Atualizado posteriormente
          }
        });

        blockIdMap.set(block.id, newBlock.id);

        for (const question of block.questions) {
          const newQuestion = await tx.question.create({
            data: {
              blockId: newBlock.id,
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

          questionIdMap.set(question.id, newQuestion.id);

          // Duplica opções
          for (const opt of question.options) {
            const newOpt = await tx.questionOption.create({
              data: {
                questionId: newQuestion.id,
                label: opt.label,
                value: opt.value,
                orderIndex: opt.orderIndex
              }
            });
            optionIdMap.set(opt.id, newOpt.id);
          }

          // Duplica scaleOptions
          for (const sOpt of question.scaleOptions) {
            await tx.questionScaleOption.create({
              data: {
                questionId: newQuestion.id,
                numericValue: sOpt.numericValue,
                label: sOpt.label,
                emoji: sOpt.emoji,
                icon: sOpt.icon,
                orderIndex: sOpt.orderIndex
              }
            });
          }

          // Duplica mídias da questão
          for (const media of question.medias) {
            await tx.media.create({
              data: {
                questionId: newQuestion.id,
                type: media.type,
                url: media.url,
                fileName: media.fileName,
                mimeType: media.mimeType,
                fileSize: media.fileSize,
                storageKey: media.storageKey,
                orderIndex: media.orderIndex,
                responseLimit: media.responseLimit
              }
            });
          }
        }
      }

      // 4. Atualiza os fallbackBlockId dos blocos duplicados
      for (const block of source.blocks) {
        if (block.fallbackBlockId && blockIdMap.has(block.fallbackBlockId)) {
          const newBlockId = blockIdMap.get(block.id);
          const newFallbackBlockId = blockIdMap.get(block.fallbackBlockId);

          if (newBlockId && newFallbackBlockId) {
            await tx.block.update({
              where: { id: newBlockId },
              data: { fallbackBlockId: newFallbackBlockId }
            });
          }
        }
      }

      // 5. Duplica as regras condicionais com as referências mapeadas
      for (const block of source.blocks) {
        for (const question of block.questions) {
          if (!question.rules || question.rules.length === 0) continue;

          const newQuestionId = questionIdMap.get(question.id);
          if (!newQuestionId) continue;

          for (const rule of question.rules) {
            const newTargetBlockId = blockIdMap.get(rule.targetBlockId);
            if (!newTargetBlockId) continue;

            const newMatchValue = optionIdMap.get(rule.matchValue) || rule.matchValue;

            await tx.conditionalRule.create({
              data: {
                questionId: newQuestionId,
                operator: rule.operator,
                matchValue: newMatchValue,
                targetBlockId: newTargetBlockId
              }
            });
          }
        }
      }

      return newSurvey;
    });
  }
}
