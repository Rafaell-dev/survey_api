import { PublicSurveyRepository } from '../repositories/public-survey.repository';

export class StartSurveyService {
  constructor(private repository: PublicSurveyRepository) {}

  async execute(surveyId: string, identifier?: string) {
    const survey = await this.repository.findPublishedSurveyById(surveyId);

    if (!survey || survey.status === 'DRAFT') {
      const err = new Error('Survey not found');
      (err as any).status = 404;
      throw err;
    }

    if (survey.status === 'ARCHIVED') {
      const err = new Error('Survey arquivado e não está mais disponível');
      (err as any).status = 410;
      throw err;
    }

    const participant = await this.repository.createParticipant(identifier);
    const response = await this.repository.createSurveyResponse(participant.id, survey.id);

    return {
      participantId: response.participantId,
      responseId: response.id,
      status: response.status,
      startedAt: response.startedAt
    };
  }
}
