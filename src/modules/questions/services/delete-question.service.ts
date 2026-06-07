import { PrismaQuestionRepository } from '../repositories/question.repository';

export class DeleteQuestionService {
  constructor(private questionRepository: PrismaQuestionRepository) {}

  async execute(questionId: string, researcherId: string) {
    const question = await this.questionRepository.findById(questionId);

    if (!question) {
      const err = new Error('Pergunta não encontrada');
      (err as any).status = 404;
      throw err;
    }

    if (question.block.survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado');
      (err as any).status = 403;
      throw err;
    }

    if (question.block.survey.status !== 'DRAFT') {
      const err = new Error('Survey already published and cannot be structurally modified.');
      (err as any).status = 409;
      throw err;
    }

    if (question.block.survey.responses.length > 0) {
      const err = new Error('Não é possível excluir perguntas após o início da coleta de respostas no survey');
      (err as any).status = 409;
      throw err;
    }

    if (question.answers.length > 0) {
      const err = new Error('Não é possível excluir perguntas que já possuam respostas');
      (err as any).status = 409;
      throw err;
    }

    await this.questionRepository.delete(questionId);
    await this.questionRepository.shiftOrderIndicesDown(question.blockId, question.orderIndex);

    return { success: true };
  }
}
