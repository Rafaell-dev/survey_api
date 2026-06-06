import { FastifyInstance } from 'fastify';
import { BlocksController } from './controllers/blocks.controller';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export async function blocksRoutes(app: FastifyInstance) {
  const blocksController = new BlocksController();

  app.addHook('preHandler', jwtAuthGuard);

  app.post('/surveys/:surveyId/blocks', blocksController.create.bind(blocksController));
  app.get('/surveys/:surveyId/blocks', blocksController.list.bind(blocksController));
  app.patch('/surveys/:surveyId/blocks/reorder', blocksController.reorder.bind(blocksController));

  app.get('/blocks/:blockId', blocksController.get.bind(blocksController));
  app.patch('/blocks/:blockId', blocksController.update.bind(blocksController));
  app.delete('/blocks/:blockId', blocksController.delete.bind(blocksController));
}
