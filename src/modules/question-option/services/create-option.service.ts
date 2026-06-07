import { PrismaQuestionOptionRepository } from '../repositories/question-option.repository';
import { CreateOptionDto } from '../dtos/question-option.schema';
import { prisma } from '../../../lib/prisma';

export class CreateOptionService {
  constructor(private repository: PrismaQuestionOptionRepository) {}

  async execute(questionId: string, payload: CreateOptionDto, researcherId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        answers: { take: 1 },
        block: { include: { survey: true } }
      }
    });

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

    if (question.block.survey.status === 'ARCHIVED') {
      const err = new Error('Não é possível adicionar opções em um survey arquivado');
      (err as any).status = 409;
      throw err;
    }

    if (question.type !== 'SINGLE_CHOICE' && question.type !== 'MULTIPLE_CHOICE') {
      const err = new Error('Apenas perguntas SINGLE_CHOICE e MULTIPLE_CHOICE podem possuir opções');
      (err as any).status = 409;
      throw err;
    }

    if (question.answers.length > 0) {
      const err = new Error('Não é possível adicionar opções após o início da coleta de respostas');
      (err as any).status = 409;
      throw err;
    }

    if (payload.value !== undefined) {
      const existsValue = await this.repository.existsValueInQuestion(questionId, payload.value);
      if (existsValue) {
        const err = new Error('O value informado já existe nesta pergunta');
        (err as any).status = 409;
        throw err;
      }
    }

    const currentCount = await this.repository.countByQuestion(questionId);
    const orderIndex = currentCount + 1;

    return this.repository.create({
      questionId,
      label: payload.label,
      value: payload.value ?? null,
      orderIndex
    });
  }
}
