import { PrismaConditionalRuleRepository } from '../repositories/conditional-rule.repository';

export class GetRuleService {
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

    const { question, ...rest } = rule;
    return rest;
  }
}
