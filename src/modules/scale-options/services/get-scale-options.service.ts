import { PrismaScaleOptionRepository } from '../repositories/scale-option.repository';
import { prisma } from '../../../lib/prisma';

export class GetScaleOptionsService {
  constructor(private repository: PrismaScaleOptionRepository) {}

  async execute(questionId: string, researcherId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
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

    const options = await this.repository.findByQuestionId(questionId);

    return {
      questionId: question.id,
      scaleVisualType: question.scaleVisualType,
      scaleStart: question.scaleStart,
      scaleEnd: question.scaleEnd,
      options: options.map(o => ({
        numericValue: o.numericValue,
        label: o.label,
        emoji: o.emoji,
        icon: o.icon
      }))
    };
  }
}
