import { PrismaQuestionRepository } from '../repositories/question.repository';
import { UpdateQuestionDto } from '../dtos/question.schema';
import { QuestionType } from '@prisma/client';

export class UpdateQuestionService {
  constructor(private questionRepository: PrismaQuestionRepository) {}

  async execute(questionId: string, data: UpdateQuestionDto, researcherId: string) {
    const question = await this.questionRepository.findById(questionId);

    if (!question) {
      const err = new Error('Pergunta não encontrada');
      (err as any).status = 404;
      throw err;
    }

    if (question.block.survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado');
      (err as any).status = 403;
      throw err;
    }

    if (question.block.survey.status !== 'DRAFT') {
      const err = new Error('Survey already published and cannot be structurally modified.');
      (err as any).status = 409;
      throw err;
    }

    const hasSurveyResponses = question.block.survey.responses.length > 0;
    const hasQuestionAnswers = question.answers.length > 0;

    const isStructuralChange = 
      (data.type !== undefined && data.type !== question.type) ||
      (data.scaleStart !== undefined && data.scaleStart !== question.scaleStart) ||
      (data.scaleEnd !== undefined && data.scaleEnd !== question.scaleEnd) ||
      (data.scaleVisualType !== undefined && data.scaleVisualType !== question.scaleVisualType);

    if (isStructuralChange && hasSurveyResponses) {
      const err = new Error('Não é possível alterar estrutura da pergunta após início das respostas');
      (err as any).status = 409;
      throw err;
    }
    
    if (data.type !== undefined && data.type !== question.type && hasQuestionAnswers) {
      const err = new Error('Não é possível alterar o tipo da pergunta após já existirem respostas');
      (err as any).status = 409;
      throw err;
    }

    const newType = data.type ?? question.type;
    const newScaleStart = data.scaleStart !== undefined ? data.scaleStart : question.scaleStart;
    const newScaleEnd = data.scaleEnd !== undefined ? data.scaleEnd : question.scaleEnd;
    const newVisualType = data.scaleVisualType !== undefined ? data.scaleVisualType : question.scaleVisualType;

    const isScaleType = newType === QuestionType.LIKERT || newType === QuestionType.SLIDER;

    if (isScaleType) {
      if (newScaleStart === null || newScaleEnd === null || !newVisualType) {
        const err = new Error('Perguntas com escala exigem scaleStart, scaleEnd e scaleVisualType');
        (err as any).status = 400;
        throw err;
      }
      if (newScaleStart >= newScaleEnd) {
        const err = new Error('scaleEnd deve ser maior que scaleStart');
        (err as any).status = 400;
        throw err;
      }
    } else {
      if (newScaleStart !== null || newScaleEnd !== null || newVisualType !== null) {
        if (data.scaleStart !== undefined || data.scaleEnd !== undefined || data.scaleVisualType !== undefined) {
          const err = new Error('Perguntas sem escala não devem enviar campos de escala');
          (err as any).status = 400;
          throw err;
        }
      }
    }

    const updatedData: any = { ...data };
    if (!isScaleType && data.type !== undefined && data.type !== question.type) {
      updatedData.scaleStart = null;
      updatedData.scaleEnd = null;
      updatedData.scaleVisualType = null;
    }

    const updatedQuestion = await this.questionRepository.update(questionId, updatedData);
    return updatedQuestion;
  }
}
