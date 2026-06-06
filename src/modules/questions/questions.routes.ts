import { FastifyInstance } from 'fastify';
import { QuestionsController } from './controllers/questions.controller';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export async function questionsRoutes(app: FastifyInstance) {
  const questionsController = new QuestionsController();

  app.addHook('preHandler', jwtAuthGuard);

  app.post('/blocks/:blockId/questions', questionsController.create.bind(questionsController));
  app.get('/blocks/:blockId/questions', questionsController.list.bind(questionsController));
  app.patch('/blocks/:blockId/questions/reorder', questionsController.reorder.bind(questionsController));

  app.get('/questions/:questionId', questionsController.get.bind(questionsController));
  app.patch('/questions/:questionId', questionsController.update.bind(questionsController));
  app.delete('/questions/:questionId', questionsController.delete.bind(questionsController));
}
