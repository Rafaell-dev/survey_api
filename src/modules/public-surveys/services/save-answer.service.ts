import { PublicSurveyRepository, SaveAnswerData } from '../repositories/public-survey.repository';

export class SaveAnswerService {
  constructor(private repository: PublicSurveyRepository) {}

  async execute(responseId: string, questionId: string, data: SaveAnswerData) {
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

    const question = await this.repository.findQuestionById(questionId);
    if (!question) {
      const err = new Error('Pergunta não encontrada');
      (err as any).status = 404;
      throw err;
    }

    switch(question.type) {
      case 'SHORT_TEXT':
      case 'LONG_TEXT':
        if (!data.textValue) throw this.formatError('textValue é obrigatório para questões de texto');
        break;
      case 'SINGLE_CHOICE':
        if (!data.selectedOptionId) throw this.formatError('selectedOptionId é obrigatório para escolha única');
        break;
      case 'MULTIPLE_CHOICE':
        if (!data.selectedOptionsIds || data.selectedOptionsIds.length === 0) throw this.formatError('selectedOptionsIds é obrigatório para múltipla escolha');
        break;
      case 'LIKERT':
      case 'SLIDER':
        if (data.numericValue === undefined) throw this.formatError('numericValue é obrigatório para escalas');
        break;
      case 'MEDIA_ONLY':
        break;
    }

    return this.repository.saveAnswer(responseId, questionId, data);
  }

  private formatError(msg: string) {
    const err = new Error(msg);
    (err as any).status = 400;
    return err;
  }
}
