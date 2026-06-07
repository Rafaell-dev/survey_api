import { PrismaMediaRepository } from '../repositories/media.repository';
import { StorageProvider } from '../../../providers/storage/StorageProvider';

export class DeleteMediaService {
  constructor(
    private repository: PrismaMediaRepository,
    private storageProvider: StorageProvider
  ) {}

  async execute(mediaId: string, researcherId: string) {
    const media = await this.repository.findById(mediaId);

    if (!media) {
      const err = new Error('Mídia não encontrada');
      (err as any).status = 404;
      throw err;
    }

    if (!media.question) {
      const err = new Error('Mídia órfã ou pergunta não encontrada');
      (err as any).status = 404;
      throw err;
    }

    if (media.question.block.survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado');
      (err as any).status = 403;
      throw err;
    }

    if (media.question.block.survey.status !== 'DRAFT') {
      const err = new Error('Survey already published and cannot be structurally modified.');
      (err as any).status = 409;
      throw err;
    }

    if (media.question.answers.length > 0) {
      const err = new Error('Não é possível excluir mídia pois a pergunta já possui respostas');
      (err as any).status = 409;
      throw err;
    }

    if (media.storageKey) {
      try {
        await this.storageProvider.delete(media.storageKey);
      } catch (error) {
        console.error('Erro ao deletar mídia do R2:', error);
      }
    }

    await this.repository.delete(mediaId);

    return { success: true };
  }
}
