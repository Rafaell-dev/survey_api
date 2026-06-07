import { PublicSurveyRepository } from '../repositories/public-survey.repository';

export class StartSurveyService {
  constructor(private repository: PublicSurveyRepository) {}

  async execute(surveyId: string, payload: { name?: string, email?: string, phone?: string }) {
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

    const { participantIdentificationType, allowMultipleResponses } = survey;

    switch(participantIdentificationType) {
      case 'EMAIL':
        if (!payload.email) {
          const err = new Error('E-mail é obrigatório para este survey');
          (err as any).status = 400;
          throw err;
        }
        break;
      case 'PHONE':
        if (!payload.phone) {
          const err = new Error('Telefone é obrigatório para este survey');
          (err as any).status = 400;
          throw err;
        }
        break;
      case 'EMAIL_OR_PHONE':
        if (!payload.email && !payload.phone) {
          const err = new Error('E-mail ou telefone é obrigatório para este survey');
          (err as any).status = 400;
          throw err;
        }
        break;
      case 'NAME_AND_EMAIL':
        if (!payload.name || !payload.email) {
          const err = new Error('Nome e e-mail são obrigatórios para este survey');
          (err as any).status = 400;
          throw err;
        }
        break;
      case 'ANONYMOUS':
      default:
        break;
    }

    if (!allowMultipleResponses && participantIdentificationType !== 'ANONYMOUS') {
      const existingResponse = await this.repository.findResponseByEmailOrPhone(
        survey.id, 
        payload.email, 
        payload.phone
      );

      if (existingResponse) {
        const err = new Error('Você já respondeu a este survey');
        (err as any).status = 409;
        throw err;
      }
    }

    const participant = await this.repository.createParticipant(payload);
    const response = await this.repository.createSurveyResponse(participant.id, survey.id);

    return {
      participantId: response.participantId,
      responseId: response.id,
      status: response.status,
      startedAt: response.startedAt
    };
  }
}
