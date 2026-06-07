import { PrismaMediaRepository } from '../repositories/media.repository';
import { StorageProvider } from '../../../providers/storage/StorageProvider';
import { prisma } from '../../../lib/prisma';
import { validateMediaFile } from '../utils/media-validator';
import { randomUUID } from 'crypto';

export class UploadMediaService {
  constructor(
    private repository: PrismaMediaRepository,
    private storageProvider: StorageProvider
  ) {}

  async execute(
    questionId: string, 
    researcherId: string, 
    fileBuffer: Buffer, 
    fileName: string, 
    mimeType: string, 
    fileSize: number
  ) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        block: { include: { survey: true } }
      }
    });

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

    if (question.block.survey.status === 'ARCHIVED') {
      const err = new Error('Não é possível adicionar mídia em um survey arquivado');
      (err as any).status = 409;
      throw err;
    }

    const validation = validateMediaFile(mimeType, fileSize);
    if (!validation.valid) {
      const err = new Error(validation.error);
      (err as any).status = 400;
      throw err;
    }

    const extension = fileName.split('.').pop();
    const uuid = randomUUID();
    const folderType = validation.mediaType === 'IMAGE' ? 'images' : validation.mediaType === 'AUDIO' ? 'audios' : 'videos';
    const key = `surveys/${question.block.survey.id}/${folderType}/${uuid}.${extension}`;

    let publicUrl: string;
    try {
      publicUrl = await this.storageProvider.upload(fileBuffer, key, mimeType);
    } catch (error) {
      console.error('Erro no upload para o R2:', error);
      const err = new Error('Falha no upload para o provedor de storage');
      (err as any).status = 500;
      throw err;
    }

    return this.repository.create({
      questionId,
      type: validation.mediaType!,
      url: publicUrl,
      fileName,
      mimeType,
      fileSize,
      storageKey: key
    });
  }
}
