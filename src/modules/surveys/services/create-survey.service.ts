import { SurveyRepository } from '../repositories/survey.repository';
import { CreateSurveyDto } from '../dtos/survey.schema';

export class CreateSurveyService {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute(data: CreateSurveyDto, researcherId: string) {
    const survey = await this.surveyRepository.create({
      ...data,
      researcherId
    });

    return {
      id: survey.id,
      title: survey.title,
      status: survey.status
    };
  }
}
