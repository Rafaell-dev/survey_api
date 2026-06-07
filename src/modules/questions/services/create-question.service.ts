import { PrismaQuestionRepository } from '../repositories/question.repository';
import { CreateQuestionDto } from '../dtos/question.schema';
import { prisma } from '../../../lib/prisma';

export class CreateQuestionService {
  constructor(private questionRepository: PrismaQuestionRepository) {}

  async execute(blockId: string, data: CreateQuestionDto, researcherId: string) {
    const block = await prisma.block.findUnique({
      where: { id: blockId },
      include: {
        survey: {
          include: { responses: { take: 1 } }
        }
      }
    });

    if (!block) {
      const err = new Error('Bloco não encontrado');
      (err as any).status = 404;
      throw err;
    }

    if (block.survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado');
      (err as any).status = 403;
      throw err;
    }

    if (block.survey.status !== 'DRAFT') {
      const err = new Error('Survey already published and cannot be structurally modified.');
      (err as any).status = 409;
      throw err;
    }

    if (block.survey.responses.length > 0) {
      const err = new Error('Não é possível adicionar perguntas após o início da coleta de respostas');
      (err as any).status = 409;
      throw err;
    }

    const lastQuestion = await this.questionRepository.findLastQuestionByBlockId(blockId);
    const nextOrder = lastQuestion?.orderIndex ? lastQuestion.orderIndex + 1 : 1;

    const question = await this.questionRepository.create({
      ...data,
      orderIndex: nextOrder,
      blockId
    });

    return question;
  }
}
