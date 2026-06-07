import { PublicSurveyRepository } from '../repositories/public-survey.repository';

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

    let currentBlock = survey.blocks.find(b => b.orderIndex === 1);
    const visitedBlocks = new Set<string>();

    while (currentBlock) {
      if (visitedBlocks.has(currentBlock.id)) {
        return { nextBlockId: null }; // Loop infinito de regras previnido
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
        currentBlock = survey.blocks.find(b => b.id === jumpToBlockId);
      } else {
        const nextOrderIndex = currentBlock.orderIndex + 1;
        currentBlock = survey.blocks.find(b => b.orderIndex === nextOrderIndex);
      }
    }

    return { nextBlockId: null };
  }
}
