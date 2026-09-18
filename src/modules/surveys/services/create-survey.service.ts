import { SurveyRepository } from '../repositories/survey.repository';
import { CreateSurveyDto } from '../dtos/survey.schema';

export class CreateSurveyService {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute(data: CreateSurveyDto, researcherId: string) {
    const defaultWarning = "⚠️ Atenção: Ao iniciar a pesquisa, não saia da página ou mude de aba. Se você trocar de aba durante a resposta, o formulário será reiniciado e suas respostas descartadas.";
    
    let description = data.description || "";
    if (!description.includes("Atenção:")) {
      description = description ? `${description}\n\n${defaultWarning}` : defaultWarning;
    }

    const survey = await this.surveyRepository.create({
      ...data,
      description,
      researcherId
    });

    return {
      id: survey.id,
      title: survey.title,
      status: survey.status
    };
  }
}
