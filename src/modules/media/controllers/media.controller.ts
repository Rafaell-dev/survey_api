import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaMediaRepository } from '../repositories/media.repository';
import { CloudflareR2StorageProvider } from '../../../providers/storage/CloudflareR2StorageProvider';
import { UploadMediaService } from '../services/upload-media.service';
import { ListMediaService } from '../services/list-media.service';
import { GetMediaService } from '../services/get-media.service';
import { DeleteMediaService } from '../services/delete-media.service';

export class MediaController {
  private repository = new PrismaMediaRepository();
  private storageProvider = new CloudflareR2StorageProvider();

  async upload(request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ message: 'Arquivo não encontrado na requisição' });
    }

    try {
      const buffer = await data.toBuffer();
      const service = new UploadMediaService(this.repository, this.storageProvider);
      const researcherId = (request.user as any).sub;
      
      const result = await service.execute(
        request.params.questionId,
        researcherId,
        buffer,
        data.filename,
        data.mimetype,
        buffer.length
      );
      
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async list(request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) {
    try {
      const service = new ListMediaService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.questionId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async get(request: FastifyRequest<{ Params: { mediaId: string } }>, reply: FastifyReply) {
    try {
      const service = new GetMediaService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.mediaId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async delete(request: FastifyRequest<{ Params: { mediaId: string } }>, reply: FastifyReply) {
    try {
      const service = new DeleteMediaService(this.repository, this.storageProvider);
      const researcherId = (request.user as any).sub;
      await service.execute(request.params.mediaId, researcherId);
      return reply.status(200).send({ success: true });
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
