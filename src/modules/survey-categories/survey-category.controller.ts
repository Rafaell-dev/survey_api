import { FastifyRequest, FastifyReply } from 'fastify';
import { surveyCategoryService } from './survey-category.service';
import { createSurveyCategorySchema, updateSurveyCategorySchema } from './survey-category.schema';

export class SurveyCategoryController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as any).sub || (request.user as any).id;
      const categories = await surveyCategoryService.listCategories(userId);
      return reply.send(categories);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as any).sub || (request.user as any).id;
      const data = createSurveyCategorySchema.parse(request.body);
      const category = await surveyCategoryService.createCategory(userId, data);
      return reply.status(201).send(category);
    } catch (err: any) {
      return reply.status(err.status || 400).send({ message: err.message });
    }
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (request.user as any).sub || (request.user as any).id;
      const data = updateSurveyCategorySchema.parse(request.body);
      const category = await surveyCategoryService.updateCategory(userId, request.params.id, data);
      return reply.send(category);
    } catch (err: any) {
      return reply.status(err.status || 400).send({ message: err.message });
    }
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (request.user as any).sub || (request.user as any).id;
      await surveyCategoryService.deleteCategory(userId, request.params.id);
      return reply.status(204).send();
    } catch (err: any) {
      return reply.status(err.status || 400).send({ message: err.message });
    }
  }
}
