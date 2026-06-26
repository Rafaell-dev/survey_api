import { PrismaConditionalRuleRepository } from '../repositories/conditional-rule.repository';
import { UpdateRuleDto } from '../dtos/conditional-rule.schema';

export class UpdateRuleService {
  constructor(private repository: PrismaConditionalRuleRepository) {}

  async execute(ruleId: string, payload: UpdateRuleDto, researcherId: string) {
    const rule = await this.repository.findById(ruleId);

    if (!rule) {
      const err = new Error('Regra não encontrada');
      (err as any).status = 404;
      throw err;
    }

    const survey = rule.question.block.survey;

    if (survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado');
      (err as any).status = 403;
      throw err;
    }

    if (survey.status !== 'DRAFT') {
      const err = new Error('O formulário já está publicado e não pode ser modificado estruturalmente.');
      (err as any).status = 409;
      throw err;
    }

    const hasResponses = await this.repository.surveyHasResponses(survey.id);
    if (hasResponses) {
      const err = new Error('Não é possível alterar regras após o início da coleta de respostas');
      (err as any).status = 409;
      throw err;
    }

    let targetBlockId = rule.targetBlockId;
    if (payload.targetBlockId && payload.targetBlockId !== rule.targetBlockId) {
      const targetBlock = await this.repository.findTargetBlockSurvey(payload.targetBlockId);
      if (!targetBlock) {
        const err = new Error('Bloco de destino não encontrado');
        (err as any).status = 404;
        throw err;
      }

      if (targetBlock.surveyId !== survey.id) {
        const err = new Error('O bloco de destino deve pertencer ao mesmo survey');
        (err as any).status = 409;
        throw err;
      }

      if (targetBlock.id === rule.question.blockId) {
        const err = new Error('Não é possível criar regra apontando para o mesmo bloco da pergunta');
        (err as any).status = 409;
        throw err;
      }

      const hasCycle = await this.repository.detectNavigationCycle(survey.id, rule.question.blockId, targetBlock.id);
      if (hasCycle) {
        const err = new Error('Esta alteração geraria um ciclo de navegação inválido no survey');
        (err as any).status = 409;
        throw err;
      }
      
      targetBlockId = targetBlock.id;
    }

    if (payload.matchValue !== undefined && payload.matchValue !== rule.matchValue) {
      if (rule.question.type === 'LIKERT' || rule.question.type === 'SLIDER') {
        if (Number.isNaN(Number(payload.matchValue))) {
          const err = new Error('O matchValue deve ser um valor numérico para perguntas LIKERT e SLIDER');
          (err as any).status = 400;
          throw err;
        }
      }

      const isDuplicate = await this.repository.existsDuplicateRule(rule.questionId, payload.matchValue, rule.id);
      if (isDuplicate) {
        const err = new Error('Já existe uma regra para este mesmo matchValue nesta pergunta');
        (err as any).status = 409;
        throw err;
      }
    }

    return this.repository.update(ruleId, {
      operator: payload.operator,
      matchValue: payload.matchValue,
      targetBlockId: payload.targetBlockId
    });
  }
}
