import { PublicSurveyRepository } from '../repositories/public-survey.repository';
import { SaveMediaInteractionsDto } from '../dtos/response.schema';
import { redis } from '../../../lib/redis';

export class SaveMediaInteractionsService {
  constructor(private repository: PublicSurveyRepository) {}

  async execute(responseId: string, data: SaveMediaInteractionsDto) {
    const response = await this.repository.findResponseById(responseId);

    if (!response) {
      const err = new Error('Sessão não encontrada');
      (err as any).status = 404;
      throw err;
    }

    const validMediaIds = new Set<string>();
    for (const block of response.survey.blocks) {
      for (const question of block.questions) {
        for (const media of question.medias) {
          validMediaIds.add(media.id);
        }
      }
    }

    for (const interaction of data.interactions) {
      if (!validMediaIds.has(interaction.mediaId)) {
        const err = new Error(`A mídia ${interaction.mediaId} não pertence a este survey`);
        (err as any).status = 400;
        throw err;
      }
    }

    // Salvar no Redis usando List (para evitar race conditions em disparos simultâneos)
    const pipeline = redis.pipeline();
    for (const interaction of data.interactions) {
      pipeline.rpush(`tracking:media:${responseId}`, JSON.stringify(interaction));
    }
    pipeline.expire(`tracking:media:${responseId}`, 48 * 60 * 60); // 48 horas de TTL
    await pipeline.exec();

    return {
      responseId,
      interactionsSaved: data.interactions.length
    };
  }
}
