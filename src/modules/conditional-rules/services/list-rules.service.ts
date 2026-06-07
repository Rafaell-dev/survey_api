import { PrismaConditionalRuleRepository } from '../repositories/conditional-rule.repository';

export class ListRulesService {
  constructor(private repository: PrismaConditionalRuleRepository) {}

  async execute(questionId: string, researcherId: string) {
    const question = await this.repository.findQuestionSurvey(questionId);

    if (!question) {
      const err = new Error('Pergunta não encontrada');
      (err as any).status = 404;
      throw err;
    }

    const survey = question.block.survey;

    if (survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado');
      (err as any).status = 403;
      throw err;
    }

    return this.repository.findByQuestionId(questionId);
  }
}
