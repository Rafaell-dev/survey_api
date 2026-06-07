import { PublicSurveyRepository } from '../repositories/public-survey.repository';
import { SaveMediaInteractionsDto } from '../dtos/response.schema';

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

    const interactionsSaved = await this.repository.saveMediaInteractions(responseId, data.interactions);

    return {
      responseId,
      interactionsSaved
    };
  }
}
