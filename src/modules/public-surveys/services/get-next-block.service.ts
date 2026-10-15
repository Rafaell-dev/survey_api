import { PublicSurveyRepository } from '../repositories/public-survey.repository';
import { prisma } from '../../../lib/prisma';

export class GetNextBlockService {
  constructor(private repository: PublicSurveyRepository) {}

  async execute(responseId: string) {
    const response = await this.repository.findResponseById(responseId);

    if (!response) {
      const err = new Error('Sessão não encontrada');
      (err as any).status = 404;
      throw err;
    }

    const survey = response.survey;
    const answers = response.answers;
    
    if (survey.blocks.length === 0) return { nextBlockId: null };

    const answersMap = new Map();
    for (const ans of answers) {
      answersMap.set(ans.questionId, ans);
    }

    // Calcula isLimitReached para cada bloco considerando outras respostas
    const blocksWithLimits = await Promise.all(
      survey.blocks.map(async (block: any) => {
        let isLimitReached = false;
        if (block.responseLimit !== null && block.responseLimit !== undefined) {
          const count = await prisma.surveyResponse.count({
            where: {
              surveyId: survey.id,
              id: { not: responseId },
              OR: [
                { answers: { some: { question: { blockId: block.id } } } },
                { blockTrackings: { some: { blockId: block.id } } }
              ]
            }
          });
          isLimitReached = count >= block.responseLimit;
        }

        return {
          ...block,
          isLimitReached
        };
      })
    );

    const fallbackTargetBlockIds = new Set<string>();
    const fallbackOriginsMap = new Map<string, any[]>();

    for (const b of blocksWithLimits) {
      if (b.fallbackBlockId) {
        fallbackTargetBlockIds.add(b.fallbackBlockId);
        const list = fallbackOriginsMap.get(b.fallbackBlockId) || [];
        list.push(b);
        fallbackOriginsMap.set(b.fallbackBlockId, list);
      }
    }

    const shouldSkipInLinearFlow = (block: any) => {
      const alreadyAnswered = block.questions.some((q: any) => answersMap.has(q.id));

      // 1. Se atingiu o limite de respostas e o usuário não respondeu, pula no fluxo linear
      if (block.isLimitReached && !alreadyAnswered) {
        return true;
      }

      // 2. Se é exclusivo de fallback ou destino de fallback de limite
      if (block.showOnlyOnFallback || fallbackTargetBlockIds.has(block.id)) {
        const origins = fallbackOriginsMap.get(block.id) || [];
        const anyOriginTriggered = origins.some((o: any) => o.isLimitReached);
        if (!anyOriginTriggered && !alreadyAnswered) {
          return true;
        }
      }

      return false;
    };

    const findNextLinearBlock = (startOrderIndex: number) => {
      const candidates = blocksWithLimits
        .filter((b: any) => b.orderIndex >= startOrderIndex && !shouldSkipInLinearFlow(b))
        .sort((a: any, b: any) => a.orderIndex - b.orderIndex);
      return candidates[0] || null;
    };

    const resolveEffectiveBlock = (candidateBlock: any) => {
      let block = candidateBlock;
      let depth = 0;
      const seen = new Set<string>();

      while (block && depth < 10) {
        if (seen.has(block.id)) break;
        seen.add(block.id);

        const alreadyAnswered = block.questions.some((q: any) => answersMap.has(q.id));
        if (alreadyAnswered) {
          break;
        }

        if (block.isLimitReached) {
          if (block.fallbackBlockId) {
            const fallback = blocksWithLimits.find((b: any) => b.id === block.fallbackBlockId);
            if (fallback && fallback.id !== block.id) {
              block = fallback;
              depth++;
              continue;
            }
          } else {
            // Sem fallback: avança para o próximo bloco linear
            block = findNextLinearBlock(block.orderIndex + 1);
            depth++;
            continue;
          }
        }

        break;
      }
      return block;
    };

    let currentBlock = resolveEffectiveBlock(findNextLinearBlock(0));
    const visitedBlocks = new Set<string>();

    while (currentBlock) {
      if (visitedBlocks.has(currentBlock.id)) {
        return { nextBlockId: null }; // Loop infinito de regras prevenido
      }
      visitedBlocks.add(currentBlock.id);

      let isBlockPending = false;
      for (const q of currentBlock.questions) {
        if (q.isRequired && !answersMap.has(q.id) && q.type !== 'MEDIA_ONLY') {
          isBlockPending = true;
          break;
        }
      }

      if (isBlockPending) {
        return { nextBlockId: currentBlock.id };
      }

      let jumpToBlockId = null;

      for (const q of currentBlock.questions) {
        const ans = answersMap.get(q.id);
        if (!ans) continue;

        for (const rule of q.rules) {
          let triggered = false;
          const matchValue = rule.matchValue;

          if (q.type === 'SINGLE_CHOICE' && rule.operator === 'EQUALS' && ans.selectedOptionId === matchValue) triggered = true;
          if (q.type === 'MULTIPLE_CHOICE' && rule.operator === 'EQUALS' && ans.selectedOptionsIds.includes(matchValue)) triggered = true;
          if (q.type === 'SHORT_TEXT' || q.type === 'LONG_TEXT') {
            if (rule.operator === 'EQUALS' && ans.textValue === matchValue) triggered = true;
            if (rule.operator === 'NOT_EQUALS' && ans.textValue !== matchValue) triggered = true;
          }
          if ((q.type === 'LIKERT' || q.type === 'SLIDER') && ans.numericValue !== null && ans.numericValue !== undefined) {
             const mvNum = Number(matchValue);
             if (rule.operator === 'EQUALS' && ans.numericValue === mvNum) triggered = true;
             if (rule.operator === 'NOT_EQUALS' && ans.numericValue !== mvNum) triggered = true;
             if (rule.operator === 'GREATER_THAN' && ans.numericValue > mvNum) triggered = true;
             if (rule.operator === 'LESS_THAN' && ans.numericValue < mvNum) triggered = true;
          }

          if (triggered) {
            jumpToBlockId = rule.targetBlockId;
            break;
          }
        }
        if (jumpToBlockId) break;
      }

      if (jumpToBlockId) {
        currentBlock = resolveEffectiveBlock(blocksWithLimits.find((b: any) => b.id === jumpToBlockId));
      } else {
        const nextLinear = findNextLinearBlock(currentBlock.orderIndex + 1);
        currentBlock = resolveEffectiveBlock(nextLinear);
      }
    }

    return { nextBlockId: null };
  }
}
