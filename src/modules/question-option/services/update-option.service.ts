import { PrismaQuestionOptionRepository } from '../repositories/question-option.repository';
import { UpdateOptionDto } from '../dtos/question-option.schema';

export class UpdateOptionService {
  constructor(private repository: PrismaQuestionOptionRepository) {}

  async execute(optionId: string, payload: UpdateOptionDto, researcherId: string) {
    const option = await this.repository.findById(optionId);

    if (!option) {
      const err = new Error('Opção não encontrada');
      (err as any).status = 404;
      throw err;
    }

    if (option.question.block.survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado');
      (err as any).status = 403;
      throw err;
    }

    if (option.question.block.survey.status !== 'DRAFT') {
      const err = new Error('O formulário já está publicado e não pode ser modificado estruturalmente.');
      (err as any).status = 409;
      throw err;
    }

    if (option.question.answers.length > 0 && payload.value !== undefined && payload.value !== option.value) {
      const err = new Error('Não é possível alterar o value após o início da coleta de respostas');
      (err as any).status = 409;
      throw err;
    }

    if (payload.value !== undefined && payload.value !== option.value) {
      const existsValue = await this.repository.existsValueInQuestion(option.questionId, payload.value, option.id);
      if (existsValue) {
        const err = new Error('O value informado já existe nesta pergunta');
        (err as any).status = 409;
        throw err;
      }
    }

    const updateData: any = {};
    if (payload.label !== undefined) updateData.label = payload.label;
    if (payload.value !== undefined) updateData.value = payload.value;

    return this.repository.update(optionId, updateData);
  }
}
