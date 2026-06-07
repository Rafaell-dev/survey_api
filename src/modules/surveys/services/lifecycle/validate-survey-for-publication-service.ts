import { prisma } from '../../../../lib/prisma';
import { PrismaConditionalRuleRepository } from '../../../conditional-rules/repositories/conditional-rule.repository';

export class ValidateSurveyForPublicationService {
  async execute(surveyId: string): Promise<boolean> {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        blocks: {
          include: {
            questions: {
              include: {
                options: true,
                rules: true,
                medias: true
              }
            }
          }
        }
      }
    });

    if (!survey) {
      throw new Error('Survey não encontrado');
    }

    if (survey.blocks.length < 1) {
      throw new Error('Survey deve possuir pelo menos 1 bloco');
    }

    const rulesRepository = new PrismaConditionalRuleRepository();

    for (const block of survey.blocks) {
      if (block.questions.length < 1) {
        throw new Error(`O bloco '${block.title}' deve possuir pelo menos 1 pergunta`);
      }

      for (const question of block.questions) {
        if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') {
          if (question.options.length < 2) {
            throw new Error(`A pergunta ID '${question.id}' deve possuir no mínimo 2 opções de resposta`);
          }
        }

        for (const media of question.medias) {
          if (!media.url || !media.storageKey) {
            throw new Error(`A mídia ID '${media.id}' está pendente de upload no Cloudflare R2`);
          }
        }

        for (const rule of question.rules) {
          const targetBlock = await prisma.block.findUnique({ where: { id: rule.targetBlockId } });
          
          if (!targetBlock) {
            throw new Error(`Regra inválida: bloco de destino '${rule.targetBlockId}' não encontrado`);
          }

          if (targetBlock.surveyId !== survey.id) {
            throw new Error(`Regra inválida: o bloco de destino pertence a outro survey`);
          }

          if (targetBlock.id === question.blockId) {
            throw new Error(`Regra inválida: apontamento circular para o próprio bloco de origem`);
          }

          const hasCycle = await rulesRepository.detectNavigationCycle(survey.id, question.blockId, rule.targetBlockId);
          if (hasCycle) {
            throw new Error(`Ciclo de navegação detectado envolvendo o bloco '${targetBlock.title}'`);
          }
        }
      }
    }

    return true;
  }
}
