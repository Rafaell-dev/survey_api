import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaBlockRepository } from '../repositories/block.repository';
import { CreateBlockService } from '../services/create-block.service';
import { ListBlocksService } from '../services/list-blocks.service';
import { GetBlockService } from '../services/get-block.service';
import { UpdateBlockService } from '../services/update-block.service';
import { DeleteBlockService } from '../services/delete-block.service';
import { ReorderBlocksService } from '../services/reorder-blocks.service';
import { createBlockSchema, updateBlockSchema, reorderBlocksSchema } from '../dtos/block.schema';

export class BlocksController {
  private repository = new PrismaBlockRepository();

  async create(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    const parseResult = createBlockSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new CreateBlockService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.surveyId, parseResult.data, researcherId);
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async list(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const service = new ListBlocksService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.surveyId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async get(request: FastifyRequest<{ Params: { blockId: string } }>, reply: FastifyReply) {
    try {
      const service = new GetBlockService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.blockId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async update(request: FastifyRequest<{ Params: { blockId: string } }>, reply: FastifyReply) {
    const parseResult = updateBlockSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new UpdateBlockService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.blockId, parseResult.data, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async delete(request: FastifyRequest<{ Params: { blockId: string } }>, reply: FastifyReply) {
    try {
      const service = new DeleteBlockService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.blockId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async reorder(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    const parseResult = reorderBlocksSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new ReorderBlocksService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.surveyId, parseResult.data, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
