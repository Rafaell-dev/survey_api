import { PrismaConditionalRuleRepository } from '../repositories/conditional-rule.repository';

export class DeleteRuleService {
  constructor(private repository: PrismaConditionalRuleRepository) {}

  async execute(ruleId: string, researcherId: string) {
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

    if (survey.status === 'ARCHIVED') {
      const err = new Error('Não é possível excluir regra em um survey arquivado');
      (err as any).status = 409;
      throw err;
    }

    const hasResponses = await this.repository.surveyHasResponses(survey.id);
    if (hasResponses) {
      const err = new Error('Não é possível excluir regras após o início da coleta de respostas');
      (err as any).status = 409;
      throw err;
    }

    await this.repository.delete(ruleId);

    return { success: true };
  }
}
