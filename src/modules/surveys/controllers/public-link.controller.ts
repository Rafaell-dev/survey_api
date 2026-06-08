import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PublicLinkRepository } from '../repositories/public-link.repository';
import { GetPublicLinkService } from '../services/public-link/get-public-link.service';
import { GeneratePublicLinkService } from '../services/public-link/generate-public-link.service';
import { UpdatePublicLinkStatusService } from '../services/public-link/update-public-link-status.service';

const updateStatusSchema = z.object({
  publicLinkActive: z.boolean()
});

export class PublicLinkController {
  private repository = new PublicLinkRepository();

  async getLink(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const service = new GetPublicLinkService(this.repository);
      const result = await service.execute(request.params.surveyId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async generateLink(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const service = new GeneratePublicLinkService(this.repository);
      const result = await service.execute(request.params.surveyId, researcherId);
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async updateStatus(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    const parseResult = updateStatusSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const researcherId = (request.user as any).sub;
      const service = new UpdatePublicLinkStatusService(this.repository);
      const result = await service.execute(request.params.surveyId, researcherId, parseResult.data.publicLinkActive);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
