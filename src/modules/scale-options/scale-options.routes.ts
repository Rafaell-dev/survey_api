import { FastifyInstance } from 'fastify';
import { ScaleOptionsController } from './controllers/scale-options.controller';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export async function scaleOptionsRoutes(app: FastifyInstance) {
  const controller = new ScaleOptionsController();

  app.addHook('preHandler', jwtAuthGuard);

  app.post('/questions/:questionId/scale-options', controller.create.bind(controller));
  app.put('/questions/:questionId/scale-options', controller.update.bind(controller));
  app.get('/questions/:questionId/scale-options', controller.get.bind(controller));
}
