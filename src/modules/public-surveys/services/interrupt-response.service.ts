import { PublicSurveyRepository } from '../repositories/public-survey.repository';

export class InterruptResponseService {
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

    await this.repository.interruptResponse(responseId);

    return {
      success: true
    };
  }
}
