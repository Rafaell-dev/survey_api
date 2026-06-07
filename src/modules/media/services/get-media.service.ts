import { PrismaMediaRepository } from '../repositories/media.repository';

export class GetMediaService {
  constructor(private repository: PrismaMediaRepository) {}

  async execute(mediaId: string, researcherId: string) {
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

    const { question, ...rest } = media;
    return rest;
  }
}
