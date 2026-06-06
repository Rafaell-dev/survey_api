import { SurveyRepository } from '../repositories/survey.repository';
import { ListSurveysDto } from '../dtos/survey.schema';

export class ListSurveysService {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute(filters: ListSurveysDto, researcherId: string) {
    const page = filters.page;
    const limit = filters.limit;

    const repositoryFilters = {
      researcherId,
      page,
      limit,
      search: filters.search
    };

    const [items, total] = await Promise.all([
      this.surveyRepository.findMany(repositoryFilters),
      this.surveyRepository.count(repositoryFilters)
    ]);

    return {
      items,
      total,
      page,
      limit
    };
  }
}
