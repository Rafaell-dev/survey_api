import { PublicSurveyRepository } from '../repositories/public-survey.repository';
import { GetNextBlockService } from './get-next-block.service';

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

    return {
      success: true,
      totalTimeMs
    };
  }
}
