import { PublicSurveyRepository } from '../repositories/public-survey.repository';
import { stripAdminFields } from '../utils/strip-admin-fields';

export class ResumeSurveyService {
  constructor(private repository: PublicSurveyRepository) {}

  async execute(responseId: string) {
    const response = await this.repository.findResponseById(responseId);

    if (!response) {
      const err = new Error('Response session not found');
      (err as any).status = 404;
      throw err;
    }

    if (response.survey.status === 'ARCHIVED') {
      const err = new Error('Survey arquivado e não está mais disponível');
      (err as any).status = 410;
      throw err;
    }

    response.survey = stripAdminFields(response.survey);

    return {
      responseId: response.id,
      status: response.status,
      startedAt: response.startedAt,
      finishedAt: response.finishedAt,
      totalTimeMs: response.totalTimeMs,
      survey: response.survey,
      answers: response.answers
    };
  }
}
