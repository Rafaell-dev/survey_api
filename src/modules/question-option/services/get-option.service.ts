import { PrismaQuestionOptionRepository } from '../repositories/question-option.repository';

export class GetOptionService {
  constructor(private repository: PrismaQuestionOptionRepository) {}

  async execute(optionId: string, researcherId: string) {
    const option = await this.repository.findById(optionId);

    if (!option) {
      const err = new Error('Opção não encontrada');
      (err as any).status = 404;
      throw err;
    }

    if (option.question.block.survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado');
      (err as any).status = 403;
      throw err;
    }

    const { question, answers, ...rest } = option;
    return rest;
  }
}
