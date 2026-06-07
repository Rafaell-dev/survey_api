import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaQuestionOptionRepository } from '../repositories/question-option.repository';
import { CreateOptionService } from '../services/create-option.service';
import { ListOptionsService } from '../services/list-options.service';
import { GetOptionService } from '../services/get-option.service';
import { UpdateOptionService } from '../services/update-option.service';
import { DeleteOptionService } from '../services/delete-option.service';
import { ReorderOptionsService } from '../services/reorder-options.service';
import { createOptionSchema, updateOptionSchema, reorderOptionsSchema } from '../dtos/question-option.schema';

export class QuestionOptionController {
  private repository = new PrismaQuestionOptionRepository();

  async create(request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) {
    const parseResult = createOptionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new CreateOptionService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.questionId, parseResult.data, researcherId);
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async list(request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) {
    try {
      const service = new ListOptionsService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.questionId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async get(request: FastifyRequest<{ Params: { optionId: string } }>, reply: FastifyReply) {
    try {
      const service = new GetOptionService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.optionId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async update(request: FastifyRequest<{ Params: { optionId: string } }>, reply: FastifyReply) {
    const parseResult = updateOptionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new UpdateOptionService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.optionId, parseResult.data, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async delete(request: FastifyRequest<{ Params: { optionId: string } }>, reply: FastifyReply) {
    try {
      const service = new DeleteOptionService(this.repository);
      const researcherId = (request.user as any).sub;
      await service.execute(request.params.optionId, researcherId);
      return reply.status(200).send({ success: true });
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async reorder(request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) {
    const parseResult = reorderOptionsSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new ReorderOptionsService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.questionId, parseResult.data, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
