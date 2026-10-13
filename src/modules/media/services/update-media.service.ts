import { PrismaMediaRepository } from '../repositories/media.repository';
import { prisma } from '../../../lib/prisma';

export interface UpdateMediaData {
  responseLimit?: number | null;
  orderIndex?: number;
}

export class UpdateMediaService {
  constructor(private repository: PrismaMediaRepository) {}

  async execute(mediaId: string, researcherId: string, data: UpdateMediaData) {
    const media = await this.repository.findById(mediaId);

    if (!media) {
      const err = new Error('Mídia não encontrada');
      (err as any).status = 404;
      throw err;
    }

    if (!media.question || media.question.block.survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado');
      (err as any).status = 403;
      throw err;
    }

    if (data.responseLimit !== undefined && data.responseLimit !== null) {
      const limit = Number(data.responseLimit);
      if (isNaN(limit) || !Number.isInteger(limit) || limit < 1 || limit > 9999) {
        const err = new Error('O limite de respostas deve ser um número inteiro entre 1 e 9999.');
        (err as any).status = 400;
        throw err;
      }
    }

    return this.repository.update(mediaId, {
      responseLimit: data.responseLimit,
      orderIndex: data.orderIndex
    });
  }
}
