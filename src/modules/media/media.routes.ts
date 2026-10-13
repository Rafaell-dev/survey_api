import { FastifyInstance } from 'fastify';
import { MediaController } from './controllers/media.controller';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export async function mediaRoutes(app: FastifyInstance) {
  const controller = new MediaController();

  app.addHook('preHandler', jwtAuthGuard);

  app.post('/questions/:questionId/media', controller.upload.bind(controller));
  app.get('/questions/:questionId/media', controller.list.bind(controller));
  app.patch('/questions/:questionId/media/reorder', controller.reorder.bind(controller));
  
  app.get('/media/:mediaId', controller.get.bind(controller));
  app.patch('/media/:mediaId', controller.update.bind(controller));
  app.delete('/media/:mediaId', controller.delete.bind(controller));
}
