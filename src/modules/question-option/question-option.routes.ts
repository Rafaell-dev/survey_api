import { FastifyInstance } from 'fastify';
import { QuestionOptionController } from './controllers/question-option.controller';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export async function questionOptionRoutes(app: FastifyInstance) {
  const controller = new QuestionOptionController();

  app.addHook('preHandler', jwtAuthGuard);

  app.post('/questions/:questionId/options', controller.create.bind(controller));
  app.get('/questions/:questionId/options', controller.list.bind(controller));
  app.patch('/questions/:questionId/options/reorder', controller.reorder.bind(controller));

  app.get('/options/:optionId', controller.get.bind(controller));
  app.patch('/options/:optionId', controller.update.bind(controller));
  app.delete('/options/:optionId', controller.delete.bind(controller));
}
