import { PrismaConditionalRuleRepository } from '../repositories/conditional-rule.repository';
import { CreateRuleDto } from '../dtos/conditional-rule.schema';
import { QuestionType } from '@prisma/client';

export class CreateRuleService {
  constructor(private repository: PrismaConditionalRuleRepository) {}

  async execute(questionId: string, payload: CreateRuleDto, researcherId: string) {
    const question = await this.repository.findQuestionSurvey(questionId);

    if (!question) {
      const err = new Error('Pergunta não encontrada');
      (err as any).status = 404;
      throw err;
    }

    const survey = question.block.survey;

    if (survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado');
      (err as any).status = 403;
      throw err;
    }

    if (survey.status === 'ARCHIVED') {
      const err = new Error('Não é possível criar regra em um survey arquivado');
      (err as any).status = 409;
      throw err;
    }

    if (survey.responses.length > 0) {
      const err = new Error('Não é possível adicionar regras estruturais após o início da coleta de respostas');
      (err as any).status = 409;
      throw err;
    }

    const targetBlock = await this.repository.findTargetBlockSurvey(payload.targetBlockId);
    if (!targetBlock) {
      const err = new Error('Bloco de destino não encontrado');
      (err as any).status = 404;
      throw err;
    }

    if (targetBlock.surveyId !== survey.id) {
      const err = new Error('O bloco de destino deve pertencer ao mesmo survey da pergunta');
      (err as any).status = 409;
      throw err;
    }

    if (targetBlock.id === question.blockId) {
      const err = new Error('Não é possível criar regra apontando para o mesmo bloco da pergunta');
      (err as any).status = 409;
      throw err;
    }

    const validTypes: QuestionType[] = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'LIKERT', 'SLIDER'];
    if (!validTypes.includes(question.type)) {
      const err = new Error('Este tipo de pergunta não suporta regras condicionais');
      (err as any).status = 409;
      throw err;
    }

    if (question.type === 'LIKERT' || question.type === 'SLIDER') {
      if (Number.isNaN(Number(payload.matchValue))) {
        const err = new Error('O matchValue deve ser um valor numérico para perguntas LIKERT e SLIDER');
        (err as any).status = 400;
        throw err;
      }
    }

    const isDuplicate = await this.repository.existsDuplicateRule(questionId, payload.matchValue);
    if (isDuplicate) {
      const err = new Error('Já existe uma regra para este mesmo matchValue nesta pergunta');
      (err as any).status = 409;
      throw err;
    }

    const hasCycle = await this.repository.detectNavigationCycle(survey.id, question.blockId, targetBlock.id);
    if (hasCycle) {
      const err = new Error('A criação desta regra geraria um ciclo de navegação inválido no survey');
      (err as any).status = 409;
      throw err;
    }

    return this.repository.create({
      questionId,
      operator: payload.operator,
      matchValue: payload.matchValue,
      targetBlockId: payload.targetBlockId
    });
  }
}
