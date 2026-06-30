import { PublicSurveyRepository } from '../repositories/public-survey.repository';
import { GetNextBlockService } from './get-next-block.service';
import { redis } from '../../../lib/redis';

export class FinishResponseService {
  constructor(private repository: PublicSurveyRepository) {}

  async execute(responseId: string) {
    const response = await this.repository.findResponseById(responseId);

    if (!response) {
      const err = new Error('Sessão não encontrada');
      (err as any).status = 404;
      throw err;
    }

    if (response.status === 'COMPLETED') {
      const err = new Error('Esta sessão já foi finalizada');
      (err as any).status = 409;
      throw err;
    }

    const engine = new GetNextBlockService(this.repository);
    const { nextBlockId } = await engine.execute(responseId);

    if (nextBlockId !== null) {
      const err = new Error('Perguntas obrigatórias pendentes. Não é possível finalizar.');
      (err as any).status = 409;
      throw err;
    }

    const startedAt = new Date(response.startedAt).getTime();
    const now = new Date().getTime();
    const totalTimeMs = now - startedAt;

    await this.repository.completeResponse(responseId, totalTimeMs);

    // FLUSH: Ler do Redis e salvar no PostgreSQL
    try {
      const blocksData = await redis.get(`tracking:blocks:${responseId}`);
      if (blocksData) {
        const blocks = JSON.parse(blocksData);
        if (blocks.length > 0) {
          await this.repository.saveBlockTrackings(responseId, blocks);
        }
        await redis.del(`tracking:blocks:${responseId}`);
      }

      const mediaData = await redis.lrange(`tracking:media:${responseId}`, 0, -1);
      if (mediaData && mediaData.length > 0) {
        const interactions = mediaData.map(item => JSON.parse(item));
        await this.repository.saveMediaInteractions(responseId, interactions);
        await redis.del(`tracking:media:${responseId}`);
      }
    } catch (err) {
      console.error('Erro ao fazer flush do tracking do Redis para o PostgreSQL:', err);
      // Não interrompe a finalização se o tracking falhar
    }

    return {
      success: true,
      totalTimeMs
    };
  }
}
