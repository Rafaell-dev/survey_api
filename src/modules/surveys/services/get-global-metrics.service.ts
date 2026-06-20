import { SurveyRepository } from '../repositories/survey.repository';

export class GetGlobalMetricsService {
  constructor(private repository: SurveyRepository) {}

  async execute(researcherId: string) {
    return this.repository.getGlobalMetrics(researcherId);
  }
}
