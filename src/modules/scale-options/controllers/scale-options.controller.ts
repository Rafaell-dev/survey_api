import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaScaleOptionRepository } from '../repositories/scale-option.repository';
import { CreateScaleOptionsService } from '../services/create-scale-options.service';
import { UpdateScaleOptionsService } from '../services/update-scale-options.service';
import { GetScaleOptionsService } from '../services/get-scale-options.service';
import { scaleOptionsPayloadSchema } from '../dtos/scale-options.schema';

export class ScaleOptionsController {
  private repository = new PrismaScaleOptionRepository();

  async create(request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) {
    const parseResult = scaleOptionsPayloadSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new CreateScaleOptionsService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.questionId, parseResult.data, researcherId);
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async update(request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) {
    const parseResult = scaleOptionsPayloadSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new UpdateScaleOptionsService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.questionId, parseResult.data, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async get(request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) {
    try {
      const service = new GetScaleOptionsService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.questionId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
