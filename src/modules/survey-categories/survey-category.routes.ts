import { FastifyInstance } from 'fastify';
import { SurveyCategoryController } from './survey-category.controller';

export async function surveyCategoryRoutes(app: FastifyInstance) {
  const controller = new SurveyCategoryController();

  app.addHook('onRequest', (app as any).authenticate);

  app.get('/', controller.list.bind(controller));
  app.post('/', controller.create.bind(controller));
  app.put('/:id', controller.update.bind(controller));
  app.delete('/:id', controller.delete.bind(controller));
}
