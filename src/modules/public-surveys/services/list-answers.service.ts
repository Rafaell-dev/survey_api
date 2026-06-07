import { PublicSurveyRepository } from '../repositories/public-survey.repository';

export class ListAnswersService {
  constructor(private repository: PublicSurveyRepository) {}

  async execute(responseId: string) {
    const response = await this.repository.findResponseById(responseId);
    if (!response) {
      const err = new Error('Sessão não encontrada');
      (err as any).status = 404;
      throw err;
    }
    return response.answers;
  }
}
