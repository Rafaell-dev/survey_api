import { PrismaQuestionOptionRepository } from '../repositories/question-option.repository';

export class DeleteOptionService {
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

    if (option.question.block.survey.status === 'ARCHIVED') {
      const err = new Error('Não é possível excluir opções em um survey arquivado');
      (err as any).status = 409;
      throw err;
    }

    if (option.answers.length > 0) {
      const err = new Error('Não é possível excluir uma opção que já possui respostas');
      (err as any).status = 409;
      throw err;
    }

    await this.repository.delete(optionId);
    await this.repository.shiftOrderIndicesDown(option.questionId, option.orderIndex);

    return { success: true };
  }
}
