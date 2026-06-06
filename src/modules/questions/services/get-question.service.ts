import { PrismaQuestionRepository } from '../repositories/question.repository';

export class GetQuestionService {
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

    const { block, answers, ...questionData } = question;
    return questionData;
  }
}
