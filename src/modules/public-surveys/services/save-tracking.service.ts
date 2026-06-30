import { PublicSurveyRepository } from '../repositories/public-survey.repository';
import { SaveTrackingDto } from '../dtos/response.schema';
import { redis } from '../../../lib/redis';

export class SaveTrackingService {
  constructor(private repository: PublicSurveyRepository) {}

  async execute(responseId: string, data: SaveTrackingDto) {
    const response = await this.repository.findResponseById(responseId);

    if (!response) {
      const err = new Error('Sessão não encontrada');
      (err as any).status = 404;
      throw err;
    }

    // RN10: Aceita IN_PROGRESS e COMPLETED. Nenhuma trava necessária baseada em status.

    const validSurveyBlocksIds = response.survey.blocks.map(b => b.id);
    
    // RN02: Validar pertencimento
    for (const block of data.blocks) {
      if (!validSurveyBlocksIds.includes(block.blockId)) {
        const err = new Error(`O bloco ${block.blockId} não pertence a este survey`);
        (err as any).status = 400;
        throw err;
      }
    }

    // Salvar no Redis ao invés do banco (Cache temporário com TTL de 48h)
    await redis.setex(`tracking:blocks:${responseId}`, 48 * 60 * 60, JSON.stringify(data.blocks));

    return {
      responseId,
      blocksSaved: data.blocks.length
    };
  }
}
