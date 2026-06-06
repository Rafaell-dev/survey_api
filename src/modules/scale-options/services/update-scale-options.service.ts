import { PrismaScaleOptionRepository } from '../repositories/scale-option.repository';
import { UpdateScaleOptionsDto } from '../dtos/scale-options.schema';
import { prisma } from '../../../lib/prisma';
import { validateScaleOptions } from './scale-options.validator';

export class UpdateScaleOptionsService {
  constructor(private repository: PrismaScaleOptionRepository) {}

  async execute(questionId: string, payload: UpdateScaleOptionsDto, researcherId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        answers: { take: 1 },
        block: {
          include: { survey: true }
        }
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

    if (question.answers.length > 0) {
      const err = new Error('Não é possível alterar a escala pois a pergunta já possui respostas');
      (err as any).status = 409;
      throw err;
    }

    validateScaleOptions(question as any, payload);

    const dataToInsert = payload.options.map((opt, index) => ({
      questionId,
      numericValue: opt.numericValue,
      label: opt.label || null,
      emoji: opt.emoji || null,
      icon: opt.icon || null,
      orderIndex: index
    }));

    await prisma.$transaction(async (tx) => {
      await this.repository.deleteManyByQuestionId(questionId, tx);
      await this.repository.createMany(dataToInsert, tx);
    });

    return { success: true };
  }
}
